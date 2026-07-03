// apps/auth-service/src/auth/services/auth.service.ts
// CHANGES FROM PREVIOUS VERSION:
//   + login() now accepts req?: Request and passes it to createSession
//     so deviceFingerprint gets stored in DB at login time
//   + All createSession calls updated to pass req through

import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@cykruit/prisma';
import { AppLogger } from '@cykruit/logger';
import { HashService, TokenService, ErrorCodes, EmployerCompletionService } from '@cykruit/common';
import { MailService } from '@cykruit/mail';
import { AuditService, AuditAction } from '@cykruit/audit';
import { AuthRepository } from '../repositories/auth.repository';
import { SessionService } from './session.service';
import { RegisterDto } from '../dto/register.dto';
import { AccountStatus, UserRole } from '@prisma/client';
import {
    getTokenExpiration,
    formatUserResponse,
} from '../utils/auth.utils';
import { isBlockedEmailDomain, getEmailDomain } from '@cykruit/common';
import type { Request } from 'express';

const MAX_FAILED_OTP_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 15 * 60 * 1000;
const MAX_LOCKOUT_MS = 24 * 60 * 60 * 1000;
const OTP_TTL_MINUTES = 10;

@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly prisma: PrismaService,
        private readonly hashService: HashService,
        private readonly tokenService: TokenService,
        private readonly mailService: MailService,
        private readonly sessionService: SessionService,
        private readonly configService: ConfigService,
        private readonly employerCompletionService: EmployerCompletionService,
        private readonly auditService: AuditService,
        private readonly logger: AppLogger,
    ) { }

    // ── Register (Step 1: create account + send OTP) ─────────────

    async register(dto: RegisterDto) {
        if (dto.role === UserRole.EMPLOYER && isBlockedEmailDomain(dto.email)) {
            const domain = getEmailDomain(dto.email);
            throw new ConflictException({
                code: 'EMAIL_DOMAIN_NOT_ALLOWED',
                message: `Employers cannot register with personal email domains like @${domain}.`,
            });
        }

        const existingUser = await this.authRepository.findUserByEmail(dto.email);
        if (existingUser) throw new ConflictException(ErrorCodes.EMAIL_ALREADY_EXISTS);

        if (dto.phone) {
            const existingPhone = await this.authRepository.findUserByPhone(dto.phone);
            if (existingPhone) throw new ConflictException(ErrorCodes.PHONE_ALREADY_EXISTS);
        }

        const otp = this.generateOtp();
        const otpHash = this.hashService.hashToken(otp);
        const otpExpiresAt = getTokenExpiration(OTP_TTL_MINUTES / 60); // hours

        const { user } = await this.authRepository.createUserWithLoginOtp({
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            role: dto.role,
            otpHash,
            otpExpiresAt,
        });

        this.auditService.log(AuditAction.REGISTER, 'SUCCESS', user.id, undefined, {
            role: dto.role,
            emailDomain: dto.email.split('@')[1],
        });

        this.logger.log(`User registered: ${user.email}`, 'AuthService');

        try {
            await this.mailService.sendOtpEmail(user.email, otp, OTP_TTL_MINUTES);
            return { message: 'OTP sent to your email. Enter it to complete registration.' };
        } catch (error) {
            this.logger.error(`Failed to send OTP to ${user.email}`, error.stack, 'AuthService');
            return {
                warning: {
                    code: 'EMAIL_SEND_FAILED',
                    message: 'Account created but OTP email could not be sent. Please request a new OTP.',
                },
            };
        }
    }

    // ── Request OTP (login for existing accounts) ─────────────────

    async requestOtp(email: string, ipAddress: string, userAgent: string) {
        const reqCtx = { ip: ipAddress, userAgent };
        const user = await this.authRepository.findUserByEmail(email);

        if (!user) {
            // Don't reveal whether email exists
            return { message: 'If an account exists with this email, an OTP has been sent.' };
        }

        if (user.lockedUntil && new Date() < user.lockedUntil) {
            const remainingMins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            throw new UnauthorizedException({
                code: ErrorCodes.ACCOUNT_LOCKED,
                message: `Account temporarily locked. Try again in ${remainingMins} minute(s).`,
                lockedUntil: user.lockedUntil.toISOString(),
            });
        }

        if (user.status === AccountStatus.SUSPENDED)
            throw new UnauthorizedException(ErrorCodes.ACCOUNT_SUSPENDED);
        if (user.status === AccountStatus.DELETED)
            throw new UnauthorizedException(ErrorCodes.ACCOUNT_DELETED);

        const otp = this.generateOtp();
        const otpHash = this.hashService.hashToken(otp);
        const otpExpiresAt = getTokenExpiration(OTP_TTL_MINUTES / 60);

        await this.authRepository.createLoginOtp(user.id, otpHash, otpExpiresAt);

        this.auditService.log(AuditAction.LOGIN_FAILURE, 'SUCCESS', user.id, reqCtx, {
            action: 'OTP_REQUESTED',
        });

        try {
            await this.mailService.sendOtpEmail(user.email, otp, OTP_TTL_MINUTES);
        } catch (error) {
            this.logger.error(`Failed to send OTP to ${user.email}`, error.stack, 'AuthService');
        }

        return { message: 'If an account exists with this email, an OTP has been sent.' };
    }

    // ── Verify OTP (Step 2: validate + create session) ────────────

    async verifyOtp(
        email: string,
        otp: string,
        rememberMe: boolean,
        ipAddress: string,
        userAgent: string,
        req?: Request,
    ) {
        const reqCtx = { ip: ipAddress, userAgent };
        const user = await this.authRepository.findUserByEmail(email);

        if (!user) throw new UnauthorizedException(ErrorCodes.INVALID_CREDENTIALS);

        // Lockout check
        if (user.lockedUntil && new Date() < user.lockedUntil) {
            const remainingMins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            throw new UnauthorizedException({
                code: ErrorCodes.ACCOUNT_LOCKED,
                message: `Account temporarily locked. Try again in ${remainingMins} minute(s).`,
                lockedUntil: user.lockedUntil.toISOString(),
            });
        }

        const otpHash = this.hashService.hashToken(otp);
        const tokenRecord = await this.authRepository.findLoginOtp(otpHash);

        if (!tokenRecord || tokenRecord.userId !== user.id || new Date() > tokenRecord.expiresAt) {
            await this.recordFailedLogin(user.id, ipAddress);
            const updated = await this.prisma.user.findUnique({ where: { id: user.id } });
            const attemptsLeft = MAX_FAILED_OTP_ATTEMPTS - updated.failedLoginAttempts;

            this.auditService.log(AuditAction.LOGIN_FAILURE, 'FAILURE', user.id, reqCtx, {
                reason: 'INVALID_OTP',
                attemptCount: updated.failedLoginAttempts,
                attemptsLeft: Math.max(0, attemptsLeft),
            });

            if (attemptsLeft <= 0) {
                const remainingMins = Math.ceil(BASE_LOCKOUT_MS / 60000);
                throw new UnauthorizedException({
                    code: ErrorCodes.ACCOUNT_LOCKED,
                    message: `Too many failed attempts. Account locked for ${remainingMins} minute(s).`,
                    lockedUntil: updated.lockedUntil?.toISOString(),
                });
            }

            throw new UnauthorizedException({
                code: 'INVALID_OTP',
                message: attemptsLeft <= 2
                    ? `Invalid or expired OTP. ${attemptsLeft} attempt(s) remaining.`
                    : 'Invalid or expired OTP.',
            });
        }

        // OTP valid — mark used, activate account
        const activatedUser = await this.authRepository.markOtpUsedAndActivate(tokenRecord.id, user.id);

        // Auto-reactivate / cancel deletion
        if (user.status === AccountStatus.INACTIVE) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { status: AccountStatus.ACTIVE, deactivatedAt: null },
            });
        }
        if (user.status === AccountStatus.PENDING_DELETION) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { status: AccountStatus.ACTIVE, deletionScheduledAt: null },
            });
        }

        if (activatedUser.status === AccountStatus.SUSPENDED)
            throw new UnauthorizedException(ErrorCodes.ACCOUNT_SUSPENDED);

        await this.authRepository.updateLastLogin(user.id, ipAddress);

        const sessionToken = await this.sessionService.createSession(
            user.id, rememberMe, userAgent, ipAddress, req,
        );

        this.auditService.log(AuditAction.LOGIN_SUCCESS, 'SUCCESS', user.id, reqCtx, {
            rememberMe,
            isFirstLogin: !user.isEmailVerified,
        });

        this.logger.log(`User verified OTP and logged in: ${user.email}`, 'AuthService');

        return {
            data: { user: formatUserResponse(activatedUser), sessionToken },
            message: 'Login successful',
        };
    }

    // ── Get Current User ─────────────────────────────────────────

    async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userOAuthProviders: true,
                jobSeekerProfile: true,
            },
        });

        if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

        const userResponse = formatUserResponse(user);

        if (user.role === UserRole.EMPLOYER) {
            const employer = await this.authRepository.findUserWithEmployer(userId);
            const employerStatus = await this.getEmployerStatus(employer);
            const userData = { ...userResponse, employerStatus };

            if (!employer) {
                return { ...userData, info: { code: 'COMPANY_PROFILE_REQUIRED', message: 'Complete your company profile to unlock all features.' } };
            }
            if (employerStatus.profileCompletion < 50) {
                return { ...userData, info: { code: 'PROFILE_INCOMPLETE', message: `Your company profile is ${employerStatus.profileCompletion}% complete. Reach 50% to appear publicly.` } };
            }
            if (employerStatus.hasPendingVerification) {
                return { ...userData, info: { code: 'VERIFICATION_PENDING', message: 'Your company verification is under review. We will notify you once approved.' } };
            }
            if (employerStatus.needsVerification) {
                return { ...userData, info: { code: 'VERIFICATION_REQUIRED', message: 'Submit your company KYC documents to start posting jobs.' } };
            }
            return userData;
        }

        if (user.role === UserRole.SEEKER) {
            if (!user.jobSeekerProfile) {
                return { ...userResponse, info: { code: 'PROFILE_NOT_CREATED', message: 'Create your profile to start applying for jobs.' } };
            }
            const completion = (user.jobSeekerProfile as any).profileCompletion || 0;
            if (completion < 100) {
                return { ...userResponse, info: { code: 'PROFILE_INCOMPLETE', message: `Your profile is ${completion}% complete.` } };
            }
        }

        return userResponse;
    }

    // ── Logout ───────────────────────────────────────────────────

    async logout(sessionToken: string, userId?: string, reqCtx?: { ip?: string; userAgent?: string }) {
        await this.sessionService.deleteSession(sessionToken);

        if (userId) {
            this.auditService.log(AuditAction.LOGOUT, 'SUCCESS', userId, reqCtx);
        }

        return { message: 'Logout successful' };
    }

    async logoutFromAllDevices(userId: string, reqCtx?: { ip?: string; userAgent?: string }) {
        await this.sessionService.deleteAllUserSessions(userId);
        this.auditService.log(AuditAction.LOGOUT_ALL, 'SUCCESS', userId, reqCtx);
        return { message: 'Logged out from all devices successfully' };
    }

    // ── Deactivate Account ───────────────────────────────────────

    async deactivateAccount(
        userId: string,
        password?: string,
        reqCtx?: { ip?: string; userAgent?: string },
    ) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

        if (user.password && user.password !== '') {
            if (!password) {
                throw new BadRequestException({
                    code: 'PASSWORD_REQUIRED',
                    message: 'Please provide your password to confirm deactivation.',
                });
            }
            const valid = await this.hashService.comparePassword(password, user.password);
            if (!valid) {
                throw new UnauthorizedException({
                    code: 'INVALID_PASSWORD',
                    message: 'Incorrect password. Deactivation cancelled.',
                });
            }
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: AccountStatus.INACTIVE,
                deactivatedAt: new Date(),
            },
        });

        await this.sessionService.deleteAllUserSessions(userId);

        this.auditService.log(AuditAction.ACCOUNT_DEACTIVATED, 'SUCCESS', userId, reqCtx);
        this.logger.log(`Account deactivated: ${userId}`, 'AuthService');

        return { message: 'Account deactivated successfully. You can reactivate by logging in again.' };
    }

    // ── Delete Account (schedule for 30 days) ────────────────────

    async deleteAccount(
        userId: string,
        password?: string,
        reqCtx?: { ip?: string; userAgent?: string },
    ) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

        if (user.password && user.password !== '') {
            if (!password) {
                throw new BadRequestException({
                    code: 'PASSWORD_REQUIRED',
                    message: 'Please provide your password to confirm account deletion.',
                });
            }
            const valid = await this.hashService.comparePassword(password, user.password);
            if (!valid) {
                throw new UnauthorizedException({
                    code: 'INVALID_PASSWORD',
                    message: 'Incorrect password. Account deletion cancelled.',
                });
            }
        }

        const deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: AccountStatus.PENDING_DELETION,
                deletionScheduledAt,
            },
        });

        await this.sessionService.deleteAllUserSessions(userId);
        await this.prisma.token.deleteMany({ where: { userId } });

        this.auditService.log(AuditAction.ACCOUNT_DELETED, 'SUCCESS', userId, reqCtx, {
            deletionScheduledAt: deletionScheduledAt.toISOString(),
            gracePeriodDays: 30,
        });

        this.logger.log(`Account deletion scheduled: ${userId}`, 'AuthService');

        try {
            await this.mailService.sendAccountDeletionScheduledEmail(user.email, deletionScheduledAt);
        } catch (error) {
            this.logger.error(`Failed to send deletion email to ${user.email}`, error.stack, 'AuthService');
        }

        return {
            message: 'Your account has been scheduled for deletion in 30 days. You can cancel this by logging in before then.',
            deletionScheduledAt: deletionScheduledAt.toISOString(),
        };
    }

    // ── Cancel Deletion ───────────────────────────────────────────

    async cancelDeletion(userId: string, reqCtx?: { ip?: string; userAgent?: string }) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

        if (user.status !== AccountStatus.PENDING_DELETION) {
            throw new BadRequestException({
                code: 'NOT_PENDING_DELETION',
                message: 'This account is not scheduled for deletion.',
            });
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: AccountStatus.ACTIVE,
                deletionScheduledAt: null,
            },
        });

        this.auditService.log(AuditAction.ACCOUNT_DELETION_CANCELLED, 'SUCCESS', userId, reqCtx);
        this.logger.log(`Account deletion cancelled: ${userId}`, 'AuthService');

        return { message: 'Account deletion cancelled. Welcome back!' };
    }

    // ── Account lockout helpers ───────────────────────────────────

    private async recordFailedLogin(userId: string, ipAddress: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { failedLoginAttempts: true },
        });

        const newCount = (user?.failedLoginAttempts ?? 0) + 1;
        let lockedUntil: Date | undefined;

        if (newCount >= MAX_FAILED_OTP_ATTEMPTS) {
            const exponent = Math.max(0, newCount - MAX_FAILED_OTP_ATTEMPTS);
            const lockMs = Math.min(BASE_LOCKOUT_MS * Math.pow(2, exponent), MAX_LOCKOUT_MS);
            lockedUntil = new Date(Date.now() + lockMs);
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: newCount,
                lastFailedLoginAt: new Date(),
                lastFailedLoginIp: ipAddress,
                ...(lockedUntil ? { lockedUntil } : {}),
            },
        });

        this.logger.warn(
            `[LOGIN_FAIL] uid:${userId} attempts:${newCount}${lockedUntil ? ` locked_until:${lockedUntil.toISOString()}` : ''}`,
            'AuthService',
        );
    }

    private async resetFailedLoginAttempts(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { failedLoginAttempts: 0, lockedUntil: null, lastFailedLoginAt: null },
        });
    }

    // ── Private helpers ──────────────────────────────────────────

    private async getEmployerStatus(employer: any) {
        if (!employer) {
            return {
                hasProfile: false, isVerified: false, needsVerification: true,
                hasPendingVerification: false, verificationStatus: null,
                profileCompletion: 0, canAccessDashboard: false, canPostJobs: false,
            };
        }

        let profileCompletionPercentage = 0;
        try {
            const completion = await this.employerCompletionService.calculateCompletion(employer.id);
            profileCompletionPercentage = completion.percentage;
            if (employer.profileCompletion !== profileCompletionPercentage) {
                await this.prisma.employer.update({
                    where: { id: employer.id },
                    data: { profileCompletion: profileCompletionPercentage },
                });
            }
        } catch (error) {
            this.logger.error('Error calculating employer profile completion', error.stack, 'AuthService');
            profileCompletionPercentage = employer.profileCompletion || 0;
        }

        const latestVerification = employer.verifications?.[0] || null;
        const verificationStatus = latestVerification?.status || null;
        const hasPendingVerification = verificationStatus === 'PENDING' || verificationStatus === 'UNDER_REVIEW';
        const needsVerification = !employer.isVerified && !hasPendingVerification;

        return {
            hasProfile: true, isVerified: employer.isVerified,
            needsVerification, hasPendingVerification, verificationStatus,
            profileCompletion: profileCompletionPercentage,
            canAccessDashboard: employer.isVerified,
            canPostJobs: employer.isVerified && profileCompletionPercentage >= 80,
        };
    }

    private generateOtp(): string {
        // 6-digit numeric OTP
        return String(Math.floor(100000 + Math.random() * 900000));
    }
}