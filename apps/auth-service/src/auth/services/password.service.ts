// apps/auth-service/src/auth/services/password.service.ts
// FIXES:
//   - forgotPassword now accepts (dto: ForgotPasswordDto) matching controller call
//   - resetPassword now accepts (dto: ResetPasswordDto) matching controller call
//   - changePassword signature unchanged — controller already passes correct individual params
//   - verifyResetToken added (controller calls it but it wasn't here)

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "@cykruit/prisma";
import { AppLogger } from "@cykruit/logger";
import { HashService, TokenService, ErrorCodes } from "@cykruit/common";
import { MailService } from "@cykruit/mail";
import { AuditService, AuditAction } from "@cykruit/audit";
import { ConfigService } from "@nestjs/config";
import { AuthRepository } from "../repositories/auth.repository";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { getTokenExpiration } from "../utils/auth.utils";
import { generateRawToken } from "@cykruit/auth-core";

@Injectable()
export class PasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authRepository: AuthRepository,
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly logger: AppLogger,
  ) {}

  // ── Forgot password ───────────────────────────────────────────
  // FIX: controller calls forgotPassword(dto) — service now accepts DTO

  async forgotPassword(
    dto: ForgotPasswordDto,
    reqCtx?: { ip?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    const email = dto.email;

    const genericResponse = {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };

    const user = await this.authRepository.findUserByEmail(email);
    if (!user) return genericResponse;
    if (!user.password || user.password === "") return genericResponse;

    const rawToken = generateRawToken(32);
    const hashedToken = this.hashService.hashToken(rawToken);
    const expiresAt = getTokenExpiration(1); // 1 hour

    await this.authRepository.createPasswordResetToken(
      user.id,
      hashedToken,
      expiresAt,
    );

    this.auditService.log(
      AuditAction.PASSWORD_RESET_REQUESTED,
      "SUCCESS",
      user.id,
      reqCtx,
    );

    try {
      const resetUrl = `${this.configService.get("APP_URL")}/reset-password?token=${rawToken}`;
      await this.mailService.sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}`,
        error.stack,
        "PasswordService",
      );
    }

    return genericResponse;
  }

  // ── Verify reset token (GET /auth/verify-reset-token) ─────────
  // This method was called by the controller but was missing

  async verifyResetToken(
    rawToken: string,
  ): Promise<{ valid: boolean; message: string }> {
    const hashedToken = this.hashService.hashToken(rawToken);
    const tokenRecord =
      await this.authRepository.findPasswordResetToken(hashedToken);

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return {
        valid: false,
        message: "This password reset link is invalid or has expired.",
      };
    }

    return { valid: true, message: "Token is valid." };
  }

  // ── Reset password ────────────────────────────────────────────
  // FIX: controller calls resetPassword(dto) — service now accepts DTO

  async resetPassword(
    dto: ResetPasswordDto,
    reqCtx?: { ip?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    const rawToken = dto.token;
    const newPassword = dto.password;

    // Validate password confirmation
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        code: "PASSWORD_MISMATCH",
        message: "Passwords do not match.",
      });
    }

    const hashedToken = this.hashService.hashToken(rawToken);
    const tokenRecord =
      await this.authRepository.findPasswordResetToken(hashedToken);

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException({
        code: "INVALID_OR_EXPIRED_TOKEN",
        message: "This password reset link is invalid or has expired.",
      });
    }

    const hashedPassword = await this.hashService.hashPassword(newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: { password: hashedPassword },
      });
      await tx.token.delete({ where: { id: tokenRecord.id } });
      await tx.session.updateMany({
        where: { userId: tokenRecord.userId, isActive: true },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokedBy: "password_reset",
        },
      });
    });

    this.auditService.log(
      AuditAction.PASSWORD_RESET_COMPLETED,
      "SUCCESS",
      tokenRecord.userId,
      reqCtx,
      {
        sessionsRevoked: true,
      },
    );

    return {
      message:
        "Password reset successful. Please log in with your new password.",
    };
  }

  // ── Change password ───────────────────────────────────────────
  // Controller passes (userId, currentPassword, newPassword, confirmPassword)
  // FIX: confirmPassword validation was broken because controller was passing
  // dto.confirmPassword as the 4th arg, but service expected currentSessionToken there.
  // Now we explicitly validate confirm before doing anything else.

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    currentSessionToken?: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    // Validate confirmation first
    if (newPassword !== confirmPassword) {
      throw new BadRequestException({
        code: "PASSWORD_MISMATCH",
        message: "New password and confirmation do not match.",
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

    if (!user.password || user.password === "") {
      throw new BadRequestException({
        code: "NO_PASSWORD_SET",
        message: "This account uses social login. Set a password first.",
      });
    }

    const isCurrentValid = await this.hashService.comparePassword(
      currentPassword,
      user.password,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedException({
        code: "INVALID_CURRENT_PASSWORD",
        message: "Current password is incorrect.",
      });
    }

    const isSamePassword = await this.hashService.comparePassword(
      newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException({
        code: "SAME_PASSWORD",
        message: "New password must be different from your current password.",
      });
    }

    const hashedPassword = await this.hashService.hashPassword(newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      if (currentSessionToken) {
        const hashedCurrent = createHash("sha256")
          .update(currentSessionToken)
          .digest("hex");
        await tx.session.updateMany({
          where: { userId, isActive: true, token: { not: hashedCurrent } },
          data: {
            isActive: false,
            revokedAt: new Date(),
            revokedBy: "password_change",
          },
        });
      } else {
        await tx.session.updateMany({
          where: { userId, isActive: true },
          data: {
            isActive: false,
            revokedAt: new Date(),
            revokedBy: "password_change",
          },
        });
      }
    });

    this.auditService.log(
      AuditAction.PASSWORD_CHANGED,
      "SUCCESS",
      userId,
      reqCtx,
      {
        otherSessionsRevoked: true,
      },
    );

    return {
      message:
        "Password changed successfully. Other devices have been logged out.",
    };
  }
}
