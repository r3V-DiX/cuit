import { randomBytes } from "crypto";
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { AppLogger } from "@cykruit/logger";
import {
  TokenService,
  ErrorCodes,
  EmployerCompletionService,
} from "@cykruit/common";
import { hashToken } from "@cykruit/auth-core";
import { MailService } from "@cykruit/mail";
import { AuditService, AuditAction } from "@cykruit/audit";
import { AuthRepository } from "../repositories/auth.repository";
import { SessionService } from "./session.service";
import { AccountStatus, UserRole, type User } from "@prisma/client";
import { formatUserResponse } from "../utils/auth.utils";

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly sessionService: SessionService,
    private readonly employerCompletionService: EmployerCompletionService,
    private readonly auditService: AuditService,
    private readonly logger: AppLogger,
  ) {}

  // ── Get Current User ─────────────────────────────────────────

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userOAuthProviders: true,
        employer: {
          include: {
            verifications: {
              where: { isLatest: true },
              orderBy: { submittedAt: "desc" },
              take: 1,
            },
          },
        },
        jobSeekerProfile: true,
      },
    });

    if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

    const userResponse = formatUserResponse(user);

    if (user.role === UserRole.EMPLOYER) {
      const employerStatus = await this.getEmployerStatus(user);
      const userData = { ...userResponse, employerStatus };

      if (employerStatus.profileCompletion < 100) {
        return {
          ...userData,
          info: {
            code: "PROFILE_INCOMPLETE",
            message: `Your profile is ${employerStatus.profileCompletion}% complete. Complete it to unlock all features.`,
          },
        };
      }
      if (employerStatus.hasPendingVerification) {
        return {
          ...userData,
          info: {
            code: "VERIFICATION_PENDING",
            message:
              "Your company verification is under review. We will notify you once approved.",
          },
        };
      }
      if (employerStatus.needsVerification) {
        return {
          ...userData,
          info: {
            code: "VERIFICATION_REQUIRED",
            message:
              "Complete your company verification to start posting jobs.",
          },
        };
      }
      return userData;
    }

    if (user.role === UserRole.SEEKER) {
      if (!user.jobSeekerProfile) {
        return {
          ...userResponse,
          info: {
            code: "PROFILE_NOT_CREATED",
            message: "Create your profile to start applying for jobs.",
          },
        };
      }
      const completion = user.jobSeekerProfile.profileCompletion || 0;
      if (completion < 100) {
        return {
          ...userResponse,
          info: {
            code: "PROFILE_INCOMPLETE",
            message: `Your profile is ${completion}% complete.`,
          },
        };
      }
    }

    return userResponse;
  }

  // ── Logout ───────────────────────────────────────────────────

  async logout(
    sessionToken: string,
    userId?: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ) {
    await this.sessionService.deleteSession(sessionToken);

    if (userId) {
      this.auditService.log(AuditAction.LOGOUT, "SUCCESS", userId, reqCtx);
    }

    return { message: "Logout successful" };
  }

  async logoutFromAllDevices(
    userId: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ) {
    await this.sessionService.deleteAllUserSessions(userId);
    this.auditService.log(AuditAction.LOGOUT_ALL, "SUCCESS", userId, reqCtx);
    return { message: "Logged out from all devices successfully" };
  }

  // ── Deactivate Account ───────────────────────────────────────

  async deactivateAccount(
    userId: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: AccountStatus.INACTIVE,
        deactivatedAt: new Date(),
      },
    });

    await this.sessionService.deleteAllUserSessions(userId);
    await this.prisma.token.deleteMany({ where: { userId } });

    this.auditService.log(
      AuditAction.ACCOUNT_DEACTIVATED,
      "SUCCESS",
      userId,
      reqCtx,
    );
    this.logger.log(`Account deactivated: ${userId}`, "AuthService");

    return {
      message: "Account deactivated successfully. Contact support to reactivate.",
    };
  }

  // ── Delete Account (schedule for 30 days) ────────────────────

  async deleteAccount(
    userId: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

    const deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: AccountStatus.PENDING_DELETION,
        deletionScheduledAt,
      },
    });

    await this.sessionService.deleteAllUserSessions(userId);
    // Preserve any CANCEL_DELETION token so the user can cancel via the emailed link.
    await this.prisma.token.deleteMany({
      where: { userId, type: { not: "CANCEL_DELETION" } },
    });

    // Mint a cancellation token valid for the same 30-day window
    const cancelToken = randomBytes(32).toString("hex");
    await this.prisma.token.create({
      data: {
        userId,
        token: hashToken(cancelToken),
        type: "CANCEL_DELETION",
        expiresAt: deletionScheduledAt,
      },
    });

    this.auditService.log(
      AuditAction.ACCOUNT_DELETED,
      "SUCCESS",
      userId,
      reqCtx,
      {
        deletionScheduledAt: deletionScheduledAt.toISOString(),
        gracePeriodDays: 30,
      },
    );

    this.logger.log(`Account deletion scheduled: ${userId}`, "AuthService");

    try {
      await this.mailService.sendAccountDeletionScheduledEmail(
        user.email,
        deletionScheduledAt,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send deletion email to ${user.email}`,
        error.stack,
        "AuthService",
      );
    }

    return {
      message:
        "Your account has been scheduled for deletion in 30 days. Use the cancellation link in your email to cancel.",
      deletionScheduledAt: deletionScheduledAt.toISOString(),
    };
  }

  // ── Cancel Deletion ───────────────────────────────────────────

  async cancelDeletion(
    userId: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

    if (user.status !== AccountStatus.PENDING_DELETION) {
      throw new BadRequestException({
        code: "NOT_PENDING_DELETION",
        message: "This account is not scheduled for deletion.",
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      },
    });

    this.auditService.log(
      AuditAction.ACCOUNT_DELETION_CANCELLED,
      "SUCCESS",
      userId,
      reqCtx,
    );
    this.logger.log(`Account deletion cancelled: ${userId}`, "AuthService");

    return { message: "Account deletion cancelled. Welcome back!" };
  }

  // ── Private helpers ──────────────────────────────────────────

  private async getEmployerStatus(user: User & { employer?: { id: string; isVerified: boolean; profileCompletion: number; verifications?: Array<{ status: string }> } | null; jobSeekerProfile?: unknown }) {
    const employer = user.employer;
    if (!employer) {
      return {
        hasProfile: false,
        isVerified: false,
        needsVerification: true,
        hasPendingVerification: false,
        verificationStatus: null,
        profileCompletion: 0,
        canAccessDashboard: false,
        canPostJobs: false,
      };
    }

    let profileCompletionPercentage = 0;
    try {
      const completion =
        await this.employerCompletionService.calculateCompletion(employer.id);
      profileCompletionPercentage = completion.percentage;
      if (employer.profileCompletion !== profileCompletionPercentage) {
        await this.prisma.employer.update({
          where: { id: employer.id },
          data: { profileCompletion: profileCompletionPercentage },
        });
      }
    } catch (error) {
      this.logger.error(
        "Error calculating employer profile completion",
        error.stack,
        "AuthService",
      );
      profileCompletionPercentage = employer.profileCompletion || 0;
    }

    const latestVerification = employer.verifications?.[0] || null;
    const verificationStatus = latestVerification?.status || null;
    const hasPendingVerification =
      verificationStatus === "PENDING" || verificationStatus === "UNDER_REVIEW";
    const needsVerification = !employer.isVerified && !hasPendingVerification;

    return {
      hasProfile: true,
      isVerified: employer.isVerified,
      needsVerification,
      hasPendingVerification,
      verificationStatus,
      profileCompletion: profileCompletionPercentage,
      canAccessDashboard: employer.isVerified,
      canPostJobs: employer.isVerified && profileCompletionPercentage >= 80,
    };
  }
}
