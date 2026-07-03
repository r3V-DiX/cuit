// apps/auth-service/src/auth/services/verification.service.ts
// FIXES:
//   - verifyEmail now accepts (dto: VerifyEmailDto, ip, ua) matching controller call
//     internally extracts dto.token as rawToken
//   - resendVerification now accepts (dto: ResendVerificationDto) matching controller call
//     internally extracts dto.email
//   - Both now create proper reqCtx from ip/ua params

import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { AppLogger } from '@cykruit/logger';
import { HashService } from '@cykruit/common';
import { MailService } from '@cykruit/mail';
import { AuditService, AuditAction } from '@cykruit/audit';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../repositories/auth.repository';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { getTokenExpiration } from '../utils/auth.utils';
import { SessionService } from './session.service';
import { generateRawToken } from '@cykruit/auth-core';

const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class VerificationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authRepository: AuthRepository,
        private readonly hashService: HashService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        private readonly auditService: AuditService,
        private readonly logger: AppLogger,
        private readonly sessionService: SessionService,
    ) { }

    // ── Verify email ──────────────────────────────────────────────
    // FIX: controller calls verifyEmail(dto, ip, ua)
    // Service now accepts DTO + ip + ua and extracts token internally

    async verifyEmail(
        dto: VerifyEmailDto,
        ip: string,
        ua: string,
    ): Promise<{ data: { sessionToken?: string; user?: any }; message: string }> {
        const reqCtx = { ip, userAgent: ua };
        const rawToken = dto.token;

        const hashedToken = this.hashService.hashToken(rawToken);
        const tokenRecord = await this.authRepository.findVerificationToken(hashedToken);

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            throw new BadRequestException({
                code: 'INVALID_OR_EXPIRED_TOKEN',
                message: 'This verification link is invalid or has expired. Please request a new one.',
            });
        }

        if (tokenRecord.user.isEmailVerified) {
            throw new BadRequestException({
                code: 'EMAIL_ALREADY_VERIFIED',
                message: 'This email address has already been verified.',
            });
        }

        // ✅ Capture updated user from transaction — not stale pre-transaction data
        const updatedUser = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: tokenRecord.userId },
                data: {
                    isEmailVerified: true,
                    emailVerifiedAt: new Date(),
                    status: 'ACTIVE',
                },
            });
            await tx.token.delete({ where: { id: tokenRecord.id } });
            return user;
        });

        // Auto-login — create session immediately after verification
        const sessionToken = await this.sessionService.createSession(
            tokenRecord.userId, false, ua, ip,
        );

        this.auditService.log(AuditAction.EMAIL_VERIFIED, 'SUCCESS', tokenRecord.userId, reqCtx);
        this.logger.log(`Email verified: ${tokenRecord.userId}`, 'VerificationService');

        const safeUser = { ...updatedUser } as Partial<typeof updatedUser>;
        delete safeUser.password;
        delete safeUser.failedLoginAttempts;
        delete safeUser.lockedUntil;
        delete safeUser.lastFailedLoginAt;
        delete safeUser.lastFailedLoginIp;
        delete safeUser.emailVerifiedAt;
        delete safeUser.lastLogin;
        delete safeUser.lastLoginIp;
        delete safeUser.createdAt;
        delete safeUser.updatedAt;

        return {
            data: { sessionToken, user: safeUser },
            message: 'Email verified successfully.',
        };
    }
    // ── Resend verification ───────────────────────────────────────
    // FIX: controller calls resendVerification(dto)
    // Service now accepts ResendVerificationDto and extracts email internally

    async resendVerification(
        dto: ResendVerificationDto,
        ip?: string,
        ua?: string,
    ): Promise<{ message: string }> {
        const reqCtx = { ip, userAgent: ua };
        const email = dto.email;

        const genericResponse = {
            message: 'If an unverified account with that email exists, a new verification email has been sent.',
        };

        const user = await this.authRepository.findUserByEmail(email);
        if (!user || user.isEmailVerified) return genericResponse;

        const existing = await this.authRepository.findActiveVerificationToken(user.id);
        if (existing) {
            const secondsSinceLast = (Date.now() - existing.createdAt.getTime()) / 1000;
            if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
                const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
                throw new BadRequestException({
                    code: 'RESEND_TOO_SOON',
                    message: `Please wait ${waitSeconds} second(s) before requesting a new verification email.`,
                    retryAfterSeconds: waitSeconds,
                });
            }
            await this.prisma.token.delete({ where: { id: existing.id } });
        }

        const rawToken = generateRawToken(32);
        const hashedToken = this.hashService.hashToken(rawToken);
        const expiresAt = getTokenExpiration(24);

        await this.authRepository.createVerificationToken(user.id, hashedToken, expiresAt);

        this.auditService.log(AuditAction.EMAIL_VERIFICATION_RESENT, 'SUCCESS', user.id, reqCtx);

        try {
            const verifyUrl = `${this.configService.get('APP_URL')}/verify-email?token=${rawToken}`;
            await this.mailService.sendVerificationEmail(user.email, verifyUrl);
        } catch (error) {
            this.logger.error(`Failed to resend verification to ${user.email}`, error.stack, 'VerificationService');
        }

        return genericResponse;
    }

    // ── Check verification status ─────────────────────────────────

    async checkVerificationStatus(email: string): Promise<{
        isVerified: boolean;
        canResend: boolean;
        retryAfterSeconds?: number;
    }> {
        const user = await this.authRepository.findUserByEmail(email);

        if (!user) {
            return { isVerified: false, canResend: true };
        }

        if (user.isEmailVerified) {
            return { isVerified: true, canResend: false };
        }

        const existing = await this.authRepository.findActiveVerificationToken(user.id);
        if (existing) {
            const secondsSinceLast = (Date.now() - existing.createdAt.getTime()) / 1000;
            if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
                const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
                return { isVerified: false, canResend: false, retryAfterSeconds: waitSeconds };
            }
        }

        return { isVerified: false, canResend: true };
    }
}
