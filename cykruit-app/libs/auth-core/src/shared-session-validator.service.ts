// libs/auth-core/src/shared-session-validator.service.ts
//
// Single canonical ISessionValidator, used by every service that authenticates
// via the cookie-based Session table. Replaces 9 previously hand-copied,
// drifted implementations (different rotation strategies, inconsistent
// account-status checks, some with no fingerprint check at all) with one
// implementation everyone gets automatically. See docs/SESSION_MEMORY.md for
// the session-rotation race condition this consolidation fixes.
//
// AuditService/AppLogger are optional — both are @Global() so they resolve
// for any consumer that has AuditModule/LoggerModule imported anywhere in its
// tree, and silently no-op (audit trail just isn't written) for one that doesn't.

import { Injectable, Optional, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { AccountStatus, SessionType } from "@prisma/client";
import { AuditService, AuditAction } from "@cykruit/audit";
import { AppLogger } from "@cykruit/logger";
import type { Request } from "express";
import {
  ISessionValidator,
  ISessionValidationResult,
} from "./session-validator.interface";
import {
  hashToken,
  generateRawToken,
  findSessionWithGracePeriod,
  SESSION_GRACE_PERIOD_MS,
} from "./utils/session.utils";
import { generateDeviceFingerprint, compareFingerprints } from "./utils/device-fingerprint.util";

// Rotate once a session is within 5 minutes of expiry, or past the halfway
// point of its total lifetime — whichever comes first. Adapts to both short
// and 30-day "remember me" sessions.
const SESSION_ROTATION_THRESHOLD_MS = 5 * 60 * 1000;

const INACTIVE_STATUSES: AccountStatus[] = [
  AccountStatus.SUSPENDED,
  AccountStatus.DELETED,
  AccountStatus.INACTIVE,
  AccountStatus.PENDING_DELETION,
];

@Injectable()
export class SharedSessionValidator implements ISessionValidator {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService?: AuditService,
    @Optional() private readonly logger?: AppLogger,
  ) {}

  async validateSession(
    rawToken: string,
    ipAddress?: string,
    userAgent?: string,
    req?: Request,
  ): Promise<ISessionValidationResult> {
    const hashedToken = hashToken(rawToken);

    const session = await findSessionWithGracePeriod(this.prisma, hashedToken);
    if (!session) {
      throw new UnauthorizedException("Session not found or expired");
    }

    if (session.expiresAt && new Date() >= session.expiresAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isActive: false, revokedAt: new Date(), revokedBy: "expiry" },
      });
      this.auditService?.log(AuditAction.SESSION_EXPIRED, "FAILURE", session.userId, {
        ip: ipAddress,
        userAgent,
        sessionId: session.id,
      });
      throw new UnauthorizedException("Session expired");
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException("User not found");

    if (INACTIVE_STATUSES.includes(user.status)) {
      throw new UnauthorizedException("Account is not active");
    }

    // UA binding — informational only, never blocks.
    if (session.sessionType === SessionType.COOKIE && session.userAgent !== userAgent) {
      this.logger?.warn(
        `[SESSION_UA_MISMATCH] uid:${session.userId} sessionId:${session.id}`,
        "SharedSessionValidator",
      );
    }

    // Device fingerprint — blocks only on low-confidence mismatch (a
    // medium-confidence mismatch, e.g. a minor browser update, passes through).
    // Skip entirely for server-to-server requests (no accept-language header) —
    // SSR layouts call /auth/me directly and don't carry browser fingerprint headers.
    const hasAcceptLanguage = !!req?.headers?.["accept-language"];
    if (session.deviceFingerprint && req && hasAcceptLanguage) {
      const currentFp = generateDeviceFingerprint(req);
      const comparison = compareFingerprints(session.deviceFingerprint, currentFp.hash);

      if (!comparison.match && comparison.confidence === "low") {
        await this.prisma.session.update({
          where: { id: session.id },
          data: { isActive: false, revokedAt: new Date(), revokedBy: "fingerprint_mismatch" },
        });
        this.auditService?.log(
          AuditAction.SESSION_FINGERPRINT_MISMATCH,
          "FAILURE",
          session.userId,
          { ip: ipAddress, userAgent, sessionId: session.id },
          { confidence: comparison.confidence },
        );
        throw new UnauthorizedException(
          "Session invalidated — device mismatch detected. Please login again.",
        );
      }
    }

    if (session.sessionType !== SessionType.COOKIE) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date(), ipAddress },
      });
      return { user, rememberMe: session.rememberMe };
    }

    // ── Rotation, with a grace-period overlap on the token being replaced ──
    const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
    const sessionDurationMs = session.expiresAt.getTime() - session.createdAt.getTime();
    const halfLife = sessionDurationMs / 2;
    const shouldRotate = timeUntilExpiry < SESSION_ROTATION_THRESHOLD_MS || timeUntilExpiry < halfLife;

    if (!shouldRotate) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date(), ipAddress },
      });
      return { user, rememberMe: session.rememberMe };
    }

    const rawNewToken = generateRawToken(64);
    const hashedNewToken = hashToken(rawNewToken);
    const newExpiry = new Date(
      Date.now() + (session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
    );

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: hashedNewToken,
        previousToken: session.token,
        previousTokenExpiresAt: new Date(Date.now() + SESSION_GRACE_PERIOD_MS),
        expiresAt: newExpiry,
        lastActivity: new Date(),
        lastRotatedAt: new Date(),
        ipAddress,
      },
    });

    this.auditService?.log(AuditAction.SESSION_ROTATED, "SUCCESS", session.userId, {
      ip: ipAddress,
      userAgent,
      sessionId: session.id,
    });

    return { user, newToken: rawNewToken, rememberMe: session.rememberMe };
  }
}
