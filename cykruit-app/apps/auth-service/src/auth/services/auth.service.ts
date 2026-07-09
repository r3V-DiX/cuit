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
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@cykruit/prisma";
import { AppLogger } from "@cykruit/logger";
import {
  HashService,
  TokenService,
  ErrorCodes,
  EmployerCompletionService,
} from "@cykruit/common";
import { MailService } from "@cykruit/mail";
import { AuditService, AuditAction } from "@cykruit/audit";
import { AuthRepository } from "../repositories/auth.repository";
import { SessionService } from "./session.service";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { AccountStatus, UserRole } from "@prisma/client";
import { getTokenExpiration, formatUserResponse } from "../utils/auth.utils";
import { isBlockedEmailDomain, getEmailDomain } from "@cykruit/common";
import { generateRawToken } from "@cykruit/auth-core";
import type { Request } from "express"; // ✅ added

const MAX_FAILED_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 15 * 60 * 1000;
const MAX_LOCKOUT_MS = 24 * 60 * 60 * 1000;

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
  ) {}

  // ── Register ─────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.EMPLOYER && isBlockedEmailDomain(dto.email)) {
      const domain = getEmailDomain(dto.email);
      throw new ConflictException({
        code: "EMAIL_DOMAIN_NOT_ALLOWED",
        message: `@${domain} is a personal email domain. Please use your company work email (e.g. you@yourcompany.com) to register as an employer.`,
      });
    }

    const existingUser = await this.authRepository.findUserByEmail(dto.email);
    if (existingUser)
      throw new ConflictException(ErrorCodes.EMAIL_ALREADY_EXISTS);

    if (dto.phone) {
      const existingPhone = await this.authRepository.findUserByPhone(
        dto.phone,
      );
      if (existingPhone)
        throw new ConflictException(ErrorCodes.PHONE_ALREADY_EXISTS);
    }

    const hashedPassword = await this.hashService.hashPassword(dto.password);
    const verificationToken = generateRawToken(32);
    const hashedToken = this.hashService.hashToken(verificationToken);
    const tokenExpiresAt = getTokenExpiration(24);

    const { user } = await this.authRepository.createUserWithVerificationToken({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
      verificationToken: hashedToken,
      tokenExpiresAt,
    });

    this.auditService.log(AuditAction.REGISTER, "SUCCESS", user.id, undefined, {
      role: dto.role,
      emailDomain: dto.email.split("@")[1],
    });

    this.logger.log(`User registered: uid=${user.id}`, "AuthService");

    try {
      const verifyUrl = `${this.configService.get("APP_URL")}/verify-email?token=${verificationToken}`;
      await this.mailService.sendVerificationEmail(user.email, verifyUrl);
      return {
        message:
          "Registration successful. Please check your email to verify your account.",
      };
    } catch (error) {
      this.logger.error(
        `Failed to send verification email: uid=${user.id}`,
        error.stack,
        "AuthService",
      );
      return {
        warning: {
          code: "EMAIL_SEND_FAILED",
          message:
            "Account created but verification email could not be sent. Please request a new one.",
        },
      };
    }
  }

  // ── Login ────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent: string,
    req?: Request,
  ) {
    // ✅ req added
    const reqCtx = { ip: ipAddress, userAgent };
    const user = await this.authRepository.findUserByEmail(dto.email);

    if (!user) {
      this.auditService.log(
        AuditAction.LOGIN_FAILURE,
        "FAILURE",
        undefined,
        reqCtx,
        {
          reason: "USER_NOT_FOUND",
          emailDomain: dto.email.split("@")[1],
        },
      );
      throw new UnauthorizedException(ErrorCodes.INVALID_CREDENTIALS);
    }

    // ── Lockout check ─────────────────────────────────────────
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60000);

      this.auditService.log(
        AuditAction.LOGIN_LOCKED,
        "FAILURE",
        user.id,
        reqCtx,
        {
          lockedUntil: user.lockedUntil.toISOString(),
          remainingMins,
        },
      );

      throw new UnauthorizedException({
        code: ErrorCodes.ACCOUNT_LOCKED,
        message: `Account temporarily locked. Try again in ${remainingMins} minute(s).`,
        lockedUntil: user.lockedUntil.toISOString(),
      });
    }

    // ── OAuth-only user ───────────────────────────────────────
    if (!user.password || user.password === "") {
      const providers = await this.prisma.userOAuthProvider.findMany({
        where: { userId: user.id },
      });
      const names = providers.map(
        (p) => p.provider.charAt(0) + p.provider.slice(1).toLowerCase(),
      );

      this.auditService.log(
        AuditAction.LOGIN_FAILURE,
        "FAILURE",
        user.id,
        reqCtx,
        {
          reason: "OAUTH_USER_PASSWORD_LOGIN",
          providers: names.map((n) => n.toLowerCase()),
        },
      );

      throw new UnauthorizedException({
        code: "OAUTH_USER_PASSWORD_LOGIN",
        message: `This account was created with ${names.join(" or ")} login. Please use that to sign in.`,
        providers: names.map((n) => n.toLowerCase()),
      });
    }

    const isPasswordValid = await this.hashService.comparePassword(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.recordFailedLogin(user.id, ipAddress);
      const updated = await this.prisma.user.findUnique({
        where: { id: user.id },
      });
      const attemptsLeft = MAX_FAILED_ATTEMPTS - updated.failedLoginAttempts;

      this.auditService.log(
        AuditAction.LOGIN_FAILURE,
        "FAILURE",
        user.id,
        reqCtx,
        {
          reason: "INVALID_PASSWORD",
          attemptCount: updated.failedLoginAttempts,
          attemptsLeft: Math.max(0, attemptsLeft),
        },
      );

      if (attemptsLeft <= 0) {
        const remainingMins = Math.ceil(BASE_LOCKOUT_MS / 60000);
        throw new UnauthorizedException({
          code: ErrorCodes.ACCOUNT_LOCKED,
          message: `Account locked. Try again in ${remainingMins} minute(s).`,
          lockedUntil: updated.lockedUntil?.toISOString(),
        });
      }

      if (attemptsLeft <= 2) {
        throw new UnauthorizedException({
          code: ErrorCodes.INVALID_CREDENTIALS,
          message: `Invalid credentials. ${attemptsLeft} attempt(s) remaining before account is locked.`,
        });
      }

      throw new UnauthorizedException(ErrorCodes.INVALID_CREDENTIALS);
    }

    // ── Successful password validation ────────────────────────
    await this.resetFailedLoginAttempts(user.id);

    // ── Auto-reactivate if deactivated ────────────────────────
    if (user.status === AccountStatus.INACTIVE) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: AccountStatus.ACTIVE, deactivatedAt: null },
      });
      this.logger.log(
        `Account reactivated on login: uid=${user.id}`,
        "AuthService",
      );
    }

    // ── Auto-cancel deletion if pending ───────────────────────
    if (user.status === AccountStatus.PENDING_DELETION) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: AccountStatus.ACTIVE, deletionScheduledAt: null },
      });
      this.logger.log(
        `Account deletion cancelled on login: uid=${user.id}`,
        "AuthService",
      );

      await this.authRepository.updateLastLogin(user.id, ipAddress);

      const sessionToken = await this.sessionService.createSession(
        user.id,
        dto.rememberMe || false,
        userAgent,
        ipAddress,
        req, // ✅ req passed
      );

      this.auditService.log(
        AuditAction.LOGIN_SUCCESS,
        "SUCCESS",
        user.id,
        reqCtx,
        {
          rememberMe: dto.rememberMe ?? false,
          deletionCancelled: true,
        },
      );

      return {
        data: { user: formatUserResponse(user), sessionToken },
        message:
          "Welcome back! Your scheduled account deletion has been cancelled.",
        warning: {
          code: "DELETION_CANCELLED",
          message:
            "Your account deletion has been cancelled since you logged in.",
        },
      };
    }

    // ── Standard status checks ────────────────────────────────
    if (!user.isEmailVerified) {
      throw new BadRequestException({
        code: ErrorCodes.EMAIL_NOT_VERIFIED,
        message: "Please verify your email before logging in.",
      });
    }

    if (user.status === AccountStatus.SUSPENDED)
      throw new UnauthorizedException(ErrorCodes.ACCOUNT_SUSPENDED);
    if (user.status === AccountStatus.DELETED)
      throw new UnauthorizedException(ErrorCodes.ACCOUNT_DELETED);

    await this.authRepository.updateLastLogin(user.id, ipAddress);

    const sessionToken = await this.sessionService.createSession(
      user.id,
      dto.rememberMe || false,
      userAgent,
      ipAddress,
      req, // ✅ req passed
    );

    this.auditService.log(
      AuditAction.LOGIN_SUCCESS,
      "SUCCESS",
      user.id,
      reqCtx,
      {
        rememberMe: dto.rememberMe ?? false,
      },
    );

    this.logger.log(`User logged in: uid=${user.id}`, "AuthService");

    return {
      data: { user: formatUserResponse(user), sessionToken },
      message: "Login successful",
    };
  }

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
    password?: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

    if (user.password && user.password !== "") {
      if (!password) {
        throw new BadRequestException({
          code: "PASSWORD_REQUIRED",
          message: "Please provide your password to confirm deactivation.",
        });
      }
      const valid = await this.hashService.comparePassword(
        password,
        user.password,
      );
      if (!valid) {
        throw new UnauthorizedException({
          code: "INVALID_PASSWORD",
          message: "Incorrect password. Deactivation cancelled.",
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

    this.auditService.log(
      AuditAction.ACCOUNT_DEACTIVATED,
      "SUCCESS",
      userId,
      reqCtx,
    );
    this.logger.log(`Account deactivated: ${userId}`, "AuthService");

    return {
      message:
        "Account deactivated successfully. You can reactivate by logging in again.",
    };
  }

  // ── Delete Account (schedule for 30 days) ────────────────────

  async deleteAccount(
    userId: string,
    password?: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);

    if (user.password && user.password !== "") {
      if (!password) {
        throw new BadRequestException({
          code: "PASSWORD_REQUIRED",
          message: "Please provide your password to confirm account deletion.",
        });
      }
      const valid = await this.hashService.comparePassword(
        password,
        user.password,
      );
      if (!valid) {
        throw new UnauthorizedException({
          code: "INVALID_PASSWORD",
          message: "Incorrect password. Account deletion cancelled.",
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
        "Your account has been scheduled for deletion in 30 days. You can cancel this by logging in before then.",
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

  // ── Account lockout helpers ───────────────────────────────────

  private async recordFailedLogin(
    userId: string,
    ipAddress: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    const newCount = (user?.failedLoginAttempts ?? 0) + 1;
    let lockedUntil: Date | undefined;

    if (newCount >= MAX_FAILED_ATTEMPTS) {
      const exponent = Math.max(0, newCount - MAX_FAILED_ATTEMPTS);
      const lockMs = Math.min(
        BASE_LOCKOUT_MS * Math.pow(2, exponent),
        MAX_LOCKOUT_MS,
      );
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
      `[LOGIN_FAIL] uid:${userId} attempts:${newCount}${lockedUntil ? ` locked_until:${lockedUntil.toISOString()}` : ""}`,
      "AuthService",
    );
  }

  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLoginAt: null,
      },
    });
  }

  // ── Private helpers ──────────────────────────────────────────

  private async getEmployerStatus(user: any) {
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
