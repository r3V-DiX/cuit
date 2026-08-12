// admin-app/src/admin/auth/admin-auth.service.ts
// Console auth against the Admin model (admins + admin_sessions + admin_tokens).
// OTP-based: a 6-digit code is emailed, hashed (SHA-256) and stored on AdminToken;
// verification issues the same opaque session token the console has always used
// (raw value to the cookie, SHA-256 hash to the DB — hashToken/generateRawToken
// from @cykruit/auth-core, shared with the main app's session flow).

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '@cykruit/prisma';
import { generateRawToken, hashToken, resolveSessionExpiry } from '@cykruit/auth-core';
import { MailService } from '@cykruit/mail';
import { getPolicyInt } from '@cykruit/policy-config';
import type { Admin } from '@prisma/client';
import { RequestAdminOtpDto } from './dto/request-admin-otp.dto';
import { VerifyAdminOtpDto } from './dto/verify-admin-otp.dto';
import { AdminAuthAuditLogger } from '../../common';

export interface AdminLoginResult {
    admin: Pick<Admin, 'id' | 'email' | 'firstName' | 'lastName'>;
    rawToken: string;
    expiresAt: Date;
}

function generateOtp(): string {
    return String(randomInt(100000, 1000000));
}

function hashOtp(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
}

@Injectable()
export class AdminAuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
        private readonly authAuditLogger: AdminAuthAuditLogger,
    ) {}

    private static readonly MAX_FAILED_ATTEMPTS = 5;
    private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    async requestOtp(dto: RequestAdminOtpDto, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
        const otpExpiryMinutes = await getPolicyInt('otp_expiry_minutes', 10);

        const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });

        if (!admin || !admin.isActive) {
            this.authAuditLogger.log({
                action: 'ADMIN_OTP_REQUEST_FAILED',
                status: 'FAILURE',
                adminId: admin?.id,
                ipAddress,
                userAgent,
                metadata: { email: dto.email, reason: !admin ? 'not_found' : 'inactive' },
            });
            throw new NotFoundException('No admin account found for this email.');
        }

        await this.prisma.adminToken.updateMany({
            where: { adminId: admin.id, usedAt: null },
            data: { usedAt: new Date() },
        });

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + otpExpiryMinutes * 60_000);

        await this.prisma.adminToken.create({
            data: { adminId: admin.id, token: hashOtp(otp), expiresAt },
        });

        this.authAuditLogger.log({
            action: 'ADMIN_OTP_REQUESTED',
            status: 'SUCCESS',
            adminId: admin.id,
            ipAddress,
            userAgent,
        });

        // Don't block the response on the outbound email API call.
        this.mailService
            .sendOtp(admin.email, {
                firstName: admin.firstName,
                otp,
                expiresInMinutes: otpExpiryMinutes,
                purpose: 'admin-login',
            })
            .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : String(err);
                this.authAuditLogger.log({
                    action: 'ADMIN_OTP_REQUEST_FAILED',
                    status: 'FAILURE',
                    adminId: admin.id,
                    ipAddress,
                    userAgent,
                    metadata: { email: dto.email, reason: 'mail_send_failed', error: message },
                });
            });

        return { message: `OTP sent to your email. It expires in ${otpExpiryMinutes} minutes.` };
    }

    async verifyOtp(
        dto: VerifyAdminOtpDto,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AdminLoginResult> {
        const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });

        if (!admin || !admin.isActive) {
            this.authAuditLogger.log({
                action: 'ADMIN_LOGIN_FAILURE',
                status: 'FAILURE',
                adminId: admin?.id,
                ipAddress,
                userAgent,
                metadata: { email: dto.email, reason: !admin ? 'not_found' : 'inactive' },
            });
            throw new UnauthorizedException('Invalid or expired OTP.');
        }

        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
            this.authAuditLogger.log({
                action: 'ADMIN_LOGIN_FAILURE',
                status: 'FAILURE',
                adminId: admin.id,
                ipAddress,
                userAgent,
                metadata: { email: dto.email, reason: 'account_locked' },
            });
            throw new UnauthorizedException('Account temporarily locked. Try again later.');
        }

        const tokenRecord = await this.prisma.adminToken.findFirst({
            where: { adminId: admin.id, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });

        const expectedHash = tokenRecord ? hashOtp(dto.otp) : null;
        const otpMatches =
            !!tokenRecord &&
            !!expectedHash &&
            timingSafeEqual(Buffer.from(tokenRecord.token, 'hex'), Buffer.from(expectedHash, 'hex'));

        if (!otpMatches) {
            const newCount = admin.failedLoginAttempts + 1;
            const shouldLock = newCount >= AdminAuthService.MAX_FAILED_ATTEMPTS;
            await this.prisma.admin.update({
                where: { id: admin.id },
                data: {
                    failedLoginAttempts: newCount,
                    lockedUntil: shouldLock
                        ? new Date(Date.now() + AdminAuthService.LOCKOUT_DURATION_MS)
                        : null,
                },
            });
            this.authAuditLogger.log({
                action: 'ADMIN_LOGIN_FAILURE',
                status: 'FAILURE',
                adminId: admin.id,
                ipAddress,
                userAgent,
                metadata: { email: dto.email, reason: 'bad_otp', attempt: newCount, locked: shouldLock },
            });
            if (shouldLock) {
                throw new UnauthorizedException('Account temporarily locked. Try again later.');
            }
            const remaining = AdminAuthService.MAX_FAILED_ATTEMPTS - newCount;
            throw new UnauthorizedException(`Incorrect OTP. ${remaining} attempt(s) remaining.`);
        }

        const rememberMe = dto.rememberMe ?? false;
        const rawToken = generateRawToken();
        const expiresAt = await resolveSessionExpiry(rememberMe);

        await this.prisma.$transaction([
            this.prisma.adminToken.update({
                where: { id: tokenRecord.id },
                data: { usedAt: new Date() },
            }),
            this.prisma.adminSession.create({
                data: {
                    adminId: admin.id,
                    token: hashToken(rawToken),
                    expiresAt,
                    rememberMe,
                    ipAddress,
                    userAgent,
                },
            }),
            this.prisma.admin.update({
                where: { id: admin.id },
                data: {
                    lastLogin: new Date(),
                    lastLoginIp: ipAddress,
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                },
            }),
        ]);

        this.authAuditLogger.log({
            action: 'ADMIN_LOGIN_SUCCESS',
            status: 'SUCCESS',
            adminId: admin.id,
            ipAddress,
            userAgent,
        });

        return {
            admin: {
                id: admin.id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
            },
            rawToken,
            expiresAt,
        };
    }

    /** Validates a raw session token and returns the active Admin + session expiry. */
    async validateSession(rawToken: string): Promise<{ admin: Admin; expiresAt: Date }> {
        const session = await this.prisma.adminSession.findUnique({
            where: { token: hashToken(rawToken) },
            select: {
                id: true,
                expiresAt: true,
                admin: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        profileImage: true,
                        isActive: true,
                        lastLogin: true,
                        lastLoginIp: true,
                        failedLoginAttempts: true,
                        lockedUntil: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        if (!session) {
            throw new UnauthorizedException('Session not found');
        }

        if (session.expiresAt <= new Date()) {
            await this.prisma.adminSession.delete({ where: { id: session.id } });
            throw new UnauthorizedException('Session expired');
        }

        if (!session.admin.isActive) {
            throw new UnauthorizedException('Account disabled');
        }

        // Fire-and-forget activity bump — not worth failing the request over
        this.prisma.adminSession
            .update({ where: { id: session.id }, data: { lastActivity: new Date() } })
            .catch(() => undefined);

        return { admin: session.admin, expiresAt: session.expiresAt };
    }

    async logout(rawToken: string, ipAddress?: string, userAgent?: string): Promise<void> {
        const hashed = hashToken(rawToken);
        const session = await this.prisma.adminSession.findUnique({ where: { token: hashed } });

        await this.prisma.adminSession.deleteMany({ where: { token: hashed } });

        this.authAuditLogger.log({
            action: 'ADMIN_LOGOUT',
            status: 'SUCCESS',
            adminId: session?.adminId,
            ipAddress,
            userAgent,
        });
    }
}
