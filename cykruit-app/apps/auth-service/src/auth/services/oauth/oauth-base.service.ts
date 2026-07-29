// apps/auth-service/src/auth/services/oauth/oauth-base.service.ts
// FIX [4]: Import OAuthProvider directly from @prisma/client everywhere
// Previously oauth.types.ts re-exported it AND this file imported from @prisma/client
// — two import chains for the same enum caused potential type mismatch in strict TS

import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { PrismaService } from "@cykruit/prisma";
import { AppLogger } from "@cykruit/logger";
import { AuditService, AuditAction } from "@cykruit/audit";
// FIX [4]: Single import source — @prisma/client only, never from oauth.types.ts
import { AccountStatus, UserRole, EmployerMemberRole, type User } from "@prisma/client";
import { SessionService } from "../session.service";
import { OAuthUserData } from "../../types/oauth.types";
import { generateRawToken } from "@cykruit/auth-core";
import { isBlockedEmailDomain, getEmailDomain } from "@cykruit/common";

const STATE_TTL_SECONDS = 300; // 5 minutes

interface OAuthStatePayload {
  provider: string;
  role: UserRole;
  redirectUrl?: string;
  createdAt: number;
}

@Injectable()
export class OAuthBaseService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
    private readonly logger: AppLogger,
  ) {}

  async createState(
    provider: string,
    role: UserRole,
    redirectUrl?: string,
  ): Promise<string> {
    const state = generateRawToken(32);

    const payload: OAuthStatePayload = {
      provider,
      role,
      redirectUrl,
      createdAt: Date.now(),
    };

    await this.redis.set(
      `oauth_state:${state}`,
      JSON.stringify(payload),
      "EX",
      STATE_TTL_SECONDS,
    );

    return state;
  }

  async validateAndConsumeState(
    provider: string,
    state: string,
  ): Promise<{ role: UserRole; redirectUrl?: string }> {
    const key = `oauth_state:${state}`;
    // GETDEL is atomic — prevents state replay via concurrent requests
    const raw = await this.redis.getdel(key);

    if (!raw) {
      throw new UnauthorizedException({
        code: "INVALID_OAUTH_STATE",
        message: "OAuth state is invalid or has expired. Please try again.",
      });
    }

    let payload: OAuthStatePayload;
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_OAUTH_STATE",
        message: "OAuth state is malformed. Please try again.",
      });
    }

    if (payload.provider !== provider) {
      throw new UnauthorizedException({
        code: "INVALID_OAUTH_STATE",
        message: "OAuth provider mismatch.",
      });
    }

    return { role: payload.role, redirectUrl: payload.redirectUrl };
  }

  private async findEmployerByDomain(
    domain: string,
  ): Promise<{ companyName: string; companyLogo: string | null } | null> {
    // Find a KYC-verified employer where at least one member's email shares the domain.
    // Checks the Employer table directly (not user.role) so it works regardless of
    // whether the member's user row has role=EMPLOYER or SEEKER.
    const match = await this.prisma.employer.findFirst({
      where: {
        isVerified: true,
        members: {
          some: {
            user: { email: { endsWith: `@${domain}` } },
          },
        },
      },
      select: { companyName: true, companyLogo: true },
    });
    if (!match?.companyName) return null;
    return {
      companyName: match.companyName,
      companyLogo: match.companyLogo ?? null,
    };
  }

  async findOrCreateUser(
    profile: OAuthUserData,
    role: UserRole,
    ipAddress: string,
    userAgent: string,
  ): Promise<{
    userId: string;
    sessionToken: string;
    user: User;
    isNewUser: boolean;
    domainMatchEmployer: { companyName: string; companyLogo: string | null } | null;
  }> {
    const reqCtx = { ip: ipAddress, userAgent };

    // Block personal email domains for new employer OAuth registrations.
    // Existing employer accounts (existingProvider path below) are not re-checked — grandfathered in.
    if (role === UserRole.EMPLOYER && profile.email && isBlockedEmailDomain(profile.email)) {
      const domain = getEmailDomain(profile.email);
      throw new BadRequestException({
        code: "EMPLOYER_PERSONAL_EMAIL",
        message: `Employer accounts require a company email address. @${domain} is a personal email domain and is not accepted.`,
      });
    }

    const existingProvider = await this.prisma.userOAuthProvider.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      include: { user: true },
    });

    if (existingProvider) {
      const user = existingProvider.user;

      if (user.status === AccountStatus.SUSPENDED)
        throw new UnauthorizedException({
          code: "ACCOUNT_SUSPENDED",
          message: "Account is suspended.",
        });
      if (user.status === AccountStatus.DELETED)
        throw new UnauthorizedException({
          code: "ACCOUNT_DELETED",
          message: "Account no longer exists.",
        });

      await this.prisma.$transaction(async (tx) => {
        await tx.userOAuthProvider.update({
          where: { id: existingProvider.id },
          data: { lastUsedAt: new Date() },
        });
        if (!user.profileImage && profile.profileImage) {
          await tx.user.update({
            where: { id: user.id },
            data: { profileImage: profile.profileImage },
          });
        }
      });

      const sessionToken = await this.sessionService.createSession(
        user.id,
        false,
        userAgent,
        ipAddress,
      );

      this.auditService.log(
        AuditAction.OAUTH_LOGIN,
        "SUCCESS",
        user.id,
        reqCtx,
        {
          provider: profile.provider.toLowerCase(),
          isNewUser: false,
        },
      );

      return { userId: user.id, sessionToken, user, isNewUser: false, domainMatchEmployer: null };
    }

    const existingUserByEmail = profile.email
      ? await this.prisma.user.findUnique({ where: { email: profile.email } })
      : null;

    if (existingUserByEmail) {
      if (existingUserByEmail.status === AccountStatus.SUSPENDED)
        throw new UnauthorizedException({
          code: "ACCOUNT_SUSPENDED",
          message: "Account is suspended.",
        });
      if (existingUserByEmail.status === AccountStatus.DELETED)
        throw new UnauthorizedException({
          code: "ACCOUNT_DELETED",
          message: "Account no longer exists.",
        });
      if (existingUserByEmail.status === AccountStatus.INACTIVE)
        throw new UnauthorizedException({
          code: "ACCOUNT_INACTIVE",
          message: "Account is inactive. Contact support to reactivate.",
        });

      const linkedUser = await this.prisma.$transaction(async (tx) => {
        const userUpdateData: Record<string, unknown> = { isEmailVerified: true };
        if (!existingUserByEmail.profileImage && profile.profileImage) {
          userUpdateData.profileImage = profile.profileImage;
        }
        if (!existingUserByEmail.firstName && profile.firstName) {
          userUpdateData.firstName = profile.firstName;
        }
        if (!existingUserByEmail.lastName && profile.lastName) {
          userUpdateData.lastName = profile.lastName;
        }

        const updatedUser = await tx.user.update({
          where: { id: existingUserByEmail.id },
          data: userUpdateData,
        });

        await tx.userOAuthProvider.create({
          data: {
            userId: existingUserByEmail.id,
            provider: profile.provider,
            providerId: profile.providerId,
            lastUsedAt: new Date(),
          },
        });

        if (userUpdateData.firstName || userUpdateData.lastName) {
          await tx.jobSeekerProfile.updateMany({
            where: { userId: existingUserByEmail.id, firstName: "" },
            data: {
              ...(userUpdateData.firstName ? { firstName: profile.firstName } : {}),
              ...(userUpdateData.lastName ? { lastName: profile.lastName } : {}),
            },
          });
        }

        return updatedUser;
      });

      const sessionToken = await this.sessionService.createSession(
        existingUserByEmail.id,
        false,
        userAgent,
        ipAddress,
      );

      this.auditService.log(
        AuditAction.OAUTH_ACCOUNT_LINKED,
        "SUCCESS",
        existingUserByEmail.id,
        reqCtx,
        {
          provider: profile.provider.toLowerCase(),
        },
      );

      return {
        userId: existingUserByEmail.id,
        sessionToken,
        user: linkedUser,
        isNewUser: false,
        domainMatchEmployer: null,
      };
    }

    // Domain match detection: run for both SEEKER and EMPLOYER new users.
    // For EMPLOYER: if a verified company already owns their domain, don't create a stub —
    // redirect them to the request-to-join flow instead.
    // For SEEKER: same — show the domain-match banner so they know their company is on Cykruit.
    let domainMatchEmployer: { companyName: string; companyLogo: string | null } | null = null;
    if (profile.email) {
      const domain = getEmailDomain(profile.email);
      if (domain) {
        domainMatchEmployer = await this.findEmployerByDomain(domain);
      }
    }

    // If EMPLOYER role but domain already has a verified company, downgrade to SEEKER for now.
    // They will see the domain-match screen and can request to join via the UI.
    const effectiveRole = (role === UserRole.EMPLOYER && domainMatchEmployer) ? UserRole.SEEKER : role;

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          profileImage: profile.profileImage ?? null,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          password: "",
          role: effectiveRole,
          status: AccountStatus.ACTIVE,
        },
      });

      await tx.userOAuthProvider.create({
        data: {
          userId: user.id,
          provider: profile.provider,
          providerId: profile.providerId,
          lastUsedAt: new Date(),
        },
      });

      // Always create a seeker profile — needed for dashboard and role-switch.
      // EMPLOYER without domain match also gets one so switching to seeker later works.
      await tx.jobSeekerProfile.create({
        data: {
          user: { connect: { id: user.id } },
          firstName: profile.firstName,
          lastName: profile.lastName,
          availability: "Open to offers",
          profileCompletion: 0,
        },
      });

      // Only create an employer stub when there is NO domain match (user is genuinely new OWNER).
      if (effectiveRole === UserRole.EMPLOYER) {
        const slug = `${profile.email.split("@")[0].toLowerCase()}-${Date.now()}`;
        const employer = await tx.employer.create({
          data: {
            user: { connect: { id: user.id } },
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
            userId: user.id,
            role: EmployerMemberRole.OWNER,
          },
        });
      }

      return user;
    });

    const sessionToken = await this.sessionService.createSession(
      newUser.id,
      false,
      userAgent,
      ipAddress,
    );

    this.auditService.log(
      AuditAction.OAUTH_LOGIN,
      "SUCCESS",
      newUser.id,
      reqCtx,
      {
        provider: profile.provider.toLowerCase(),
        isNewUser: true,
        role,
      },
    );

    this.logger.log(
      `New OAuth user created: ${newUser.id} via ${profile.provider} (role: ${role})`,
      "OAuthBaseService",
    );

    return { userId: newUser.id, sessionToken, user: newUser, isNewUser: true, domainMatchEmployer };
  }
}
