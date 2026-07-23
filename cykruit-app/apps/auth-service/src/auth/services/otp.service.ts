import { randomInt, createHash, timingSafeEqual } from "node:crypto";
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import type Redis from "ioredis";
import { PrismaService } from "@cykruit/prisma";
import { AppLogger } from "@cykruit/logger";
import { MailService } from "@cykruit/mail";
import { AuditService, AuditAction } from "@cykruit/audit";
import { AuthRepository } from "../repositories/auth.repository";
import { SessionService } from "./session.service";
import { AccountStatus, UserRole, EmployerMemberRole } from "@prisma/client";
import { formatUserResponse } from "../utils/auth.utils";
import { isBlockedEmailDomain, getEmailDomain } from "@cykruit/common";
import { getPolicyInt } from "@cykruit/policy-config";
import { isBlacklisted } from "@cykruit/blacklist";
import type { Request } from "express";

const OTP_MAX_ATTEMPTS = 5;
const OTP_EMAIL_LIMIT = 5;        // max OTP requests per email per window
const OTP_EMAIL_WINDOW_S = 600;   // 10 minutes

function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

@Injectable()
export class OtpService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly prisma: PrismaService,
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
    private readonly logger: AppLogger,
  ) {}

  private async enforceEmailRateLimit(email: string): Promise<void> {
    const key = `otp:email:${email.toLowerCase()}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      // First request in window — set expiry
      await this.redis.expire(key, OTP_EMAIL_WINDOW_S);
    }
    if (count > OTP_EMAIL_LIMIT) {
      throw new HttpException(
        { code: "OTP_EMAIL_RATE_LIMITED", message: "Too many OTP requests for this email. Try again in 10 minutes." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async requestOtp(
    email: string,
    role: UserRole | undefined,
    ip: string,
    ua: string,
    flow?: "login" | "register",
  ): Promise<{ message: string }> {
    const reqCtx = { ip, userAgent: ua };

    await this.enforceEmailRateLimit(email);

    if (await isBlacklisted(email)) {
      // Deliberately generic — never reveal that this email/domain is blocked.
      throw new BadRequestException({
        code: "OTP_REQUEST_FAILED",
        message: "Unable to process this request. Please contact support if you believe this is an error.",
      });
    }

    if (role !== undefined && role !== UserRole.SEEKER && role !== UserRole.EMPLOYER) {
      throw new BadRequestException({
        code: "INVALID_ROLE",
        message: "Role must be SEEKER or EMPLOYER.",
      });
    }

    if (role === UserRole.EMPLOYER && isBlockedEmailDomain(email)) {
      const domain = getEmailDomain(email);
      throw new BadRequestException({
        code: "EMAIL_DOMAIN_NOT_ALLOWED",
        message: `@${domain} is a personal email domain. Use your company work email.`,
      });
    }

    let user = await this.authRepository.findUserByEmail(email);

    // When role is provided (register flow or explicit login toggle), enforce match.
    // When role is omitted (login without toggle), derive it from the existing account.
    if (role !== undefined && user && user.role !== role) {
      throw new BadRequestException({
        code: "ROLE_MISMATCH",
        message: "No account found for this email on this portal. Try the other sign-in page.",
      });
    }
    if (role === undefined && flow === "login" && user) {
      role = user.role;
    }

    // Flow gate: login requires an existing ACTIVE account; register requires no account yet
    if (flow === "login") {
      if (!user) {
        throw new BadRequestException({
          code: "ACCOUNT_NOT_FOUND",
          message: "No account found with this email. Please register first.",
        });
      }
      if (user.status === AccountStatus.PENDING) {
        throw new BadRequestException({
          code: "REGISTRATION_INCOMPLETE",
          message: "Your registration is incomplete. Please complete sign-up first.",
        });
      }
    }
    if (flow === "register" && user && user.status !== AccountStatus.PENDING) {
      throw new BadRequestException({
        code: "ACCOUNT_EXISTS",
        message: "An account with this email already exists. Please sign in instead.",
      });
    }

    // Invalidate any existing OTP_LOGIN tokens for this user
    if (user) {
      await this.prisma.token.updateMany({
        where: {
          userId: user.id,
          type: "OTP_LOGIN",
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
    }

    const otpExpiryMinutes = await getPolicyInt("otp_expiry_minutes", 10);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + otpExpiryMinutes * 60_000);

    if (!user) {
      if (!role) {
        throw new BadRequestException({
          code: "ROLE_REQUIRED",
          message: "Role is required to create a new account.",
        });
      }
      // Create stub user — PENDING status, no password, isEmailVerified=false.
      // token.create is inside the same transaction so user + OTP are atomic.
      let tokenCreatedInTx = false;
      try {
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email,
              role,
              status: AccountStatus.PENDING,
              isEmailVerified: false,
              firstName: "",
              lastName: "",
            },
          });

          if (role === UserRole.SEEKER) {
            await tx.jobSeekerProfile.create({
              data: {
                user: { connect: { id: newUser.id } },
                firstName: "",
                lastName: "",
                availability: "Open to offers",
                profileCompletion: 0,
              },
            });
          } else if (role === UserRole.EMPLOYER) {
            const slug = `${email.split("@")[0].toLowerCase()}-${Date.now()}`;
            const employer = await tx.employer.create({
              data: {
                user: { connect: { id: newUser.id } },
                companyName: "",
                slug,
                companyType: "OTHERS",
                industry: "OTHER",
                companySize: "SIZE_1_10",
                location: "",
                isVerified: false,
                profileCompletion: 0,
              },
            });
            await tx.employerMember.create({
              data: {
                employerId: employer.id,
                userId: newUser.id,
                role: EmployerMemberRole.OWNER,
              },
            });
          }

          await tx.token.create({
            data: {
              userId: newUser.id,
              token: hashOtp(otp),
              type: "OTP_LOGIN",
              expiresAt,
              metadata: JSON.stringify({ attempts: 0 }),
            },
          });

          return newUser;
        });

        tokenCreatedInTx = true;
        this.logger.log(`OTP stub user created: uid=${user.id}`, "OtpService");
      } catch (err: any) {
        if (err?.code === "P2002") {
          // Concurrent request created this user — re-fetch and fall through
          user = await this.authRepository.findUserByEmail(email);
          if (!user) throw err;
        } else {
          throw err;
        }
      }

      if (tokenCreatedInTx) {
        this.auditService.log(AuditAction.LOGIN_SUCCESS, "SUCCESS", user.id, reqCtx, {
          action: "OTP_REQUESTED",
        });
        await this.mailService.sendOtp(email, {
          firstName: user.firstName || email.split("@")[0],
          otp,
          expiresInMinutes: otpExpiryMinutes,
          purpose: "login",
        });
        return { message: `OTP sent to your email. It expires in ${otpExpiryMinutes} minutes.` };
      }
    }

    // Existing user path (or race-condition loser that re-fetched)
    await this.prisma.token.create({
      data: {
        userId: user.id,
        token: hashOtp(otp),
        type: "OTP_LOGIN",
        expiresAt,
        metadata: JSON.stringify({ attempts: 0 }),
      },
    });

    this.auditService.log(AuditAction.LOGIN_SUCCESS, "SUCCESS", user.id, reqCtx, {
      action: "OTP_REQUESTED",
    });

    await this.mailService.sendOtp(email, {
      firstName: user.firstName || email.split("@")[0],
      otp,
      expiresInMinutes: otpExpiryMinutes,
      purpose: "login",
    });

    return {
      message: `OTP sent to your email. It expires in ${otpExpiryMinutes} minutes.`,
    };
  }

  async verifyOtp(
    email: string,
    otpCode: string,
    firstName: string | undefined,
    lastName: string | undefined,
    rememberMe: boolean,
    ip: string,
    ua: string,
    req?: Request,
  ): Promise<{ data: { user: ReturnType<typeof formatUserResponse>; sessionToken: string }; message: string; isNewUser?: boolean }> {
    const reqCtx = { ip, userAgent: ua };

    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        code: "OTP_INVALID",
        message: "Invalid or expired OTP.",
      });
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException({ code: "ACCOUNT_SUSPENDED", message: "Account suspended." });
    }
    if (user.status === AccountStatus.DELETED) {
      throw new UnauthorizedException({ code: "ACCOUNT_DELETED", message: "Account deleted." });
    }
    if (user.status === AccountStatus.INACTIVE) {
      throw new UnauthorizedException({ code: "ACCOUNT_INACTIVE", message: "Account deactivated. Contact support to reactivate." });
    }
    if (user.status === AccountStatus.PENDING_DELETION) {
      throw new UnauthorizedException({ code: "ACCOUNT_PENDING_DELETION", message: "Account is scheduled for deletion. Use the cancellation link in your email." });
    }

    const tokenRecord = await this.prisma.token.findFirst({
      where: {
        userId: user.id,
        type: "OTP_LOGIN",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException({
        code: "OTP_INVALID",
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // Track attempts
    let meta: { attempts: number } = { attempts: 0 };
    try {
      meta = JSON.parse(tokenRecord.metadata as string ?? "{}");
    } catch {
      meta = { attempts: 0 };
    }

    if (meta.attempts >= OTP_MAX_ATTEMPTS) {
      await this.prisma.token.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });
      throw new UnauthorizedException({
        code: "OTP_MAX_ATTEMPTS",
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    const expectedHash = hashOtp(otpCode);
    const tokensMatch = timingSafeEqual(
      Buffer.from(tokenRecord.token, "hex"),
      Buffer.from(expectedHash, "hex"),
    );
    if (!tokensMatch) {
      await this.prisma.token.update({
        where: { id: tokenRecord.id },
        data: { metadata: JSON.stringify({ attempts: meta.attempts + 1 }) },
      });
      const remaining = OTP_MAX_ATTEMPTS - meta.attempts - 1;
      throw new UnauthorizedException({
        code: "OTP_INVALID",
        message: `Incorrect OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    // OTP correct — delete immediately to prevent row accumulation and replay
    await this.prisma.token.delete({
      where: { id: tokenRecord.id },
    });

    const isNewUser = !user.isEmailVerified;

    // Backfill name: on new users use provided name; on returning users with empty name also backfill
    const shouldWriteFirstName = !!firstName && (isNewUser || !user.firstName);
    const shouldWriteLastName = !!lastName && (isNewUser || !user.lastName);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          status: user.status === AccountStatus.PENDING ? AccountStatus.ACTIVE : user.status,
          deactivatedAt: null,
          ...(shouldWriteFirstName ? { firstName } : {}),
          ...(shouldWriteLastName ? { lastName } : {}),
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date(),
          lastLoginIp: ip,
        },
      });

      if ((shouldWriteFirstName || shouldWriteLastName) && user.role === UserRole.SEEKER) {
        await tx.jobSeekerProfile.updateMany({
          where: { userId: user.id },
          data: {
            ...(shouldWriteFirstName ? { firstName } : {}),
            ...(shouldWriteLastName ? { lastName } : {}),
          },
        });
      }

      return u;
    });

    const sessionToken = await this.sessionService.createSession(
      user.id,
      rememberMe,
      ua,
      ip,
      req,
    );

    this.auditService.log(AuditAction.LOGIN_SUCCESS, "SUCCESS", user.id, reqCtx, {
      rememberMe,
      isNewUser,
      method: "OTP",
    });

    this.logger.log(`OTP login success: uid=${user.id} new=${isNewUser}`, "OtpService");

    return {
      data: { user: formatUserResponse(updatedUser), sessionToken },
      message: isNewUser ? "Account created and signed in." : "Signed in successfully.",
      isNewUser,
    };
  }
}
