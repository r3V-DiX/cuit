// apps/seeker-profile-service/src/profile/session/session-validator.service.ts

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@cykruit/prisma";
import {
  ISessionValidator,
  ISessionValidationResult,
  generateDeviceFingerprint,
  compareFingerprints,
} from "@cykruit/auth-core";
import { SessionType } from "@prisma/client";
import * as crypto from "crypto";
import type { Request } from "express";

const SESSION_ROTATION_THRESHOLD_MS = 5 * 60 * 1000;

@Injectable()
export class SessionValidatorService implements ISessionValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async validateSession(
    token: string,
    ipAddress?: string,
    userAgent?: string,
    req?: Request,
  ): Promise<ISessionValidationResult> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const session = await this.prisma.session.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!session || !session.isActive) {
      throw new UnauthorizedException("Session not found or revoked.");
    }

    if (new Date() > session.expiresAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isActive: false, revokedAt: new Date(), revokedBy: "expired" },
      });
      throw new UnauthorizedException("Session expired. Please login again.");
    }

    const user = session.user;
    if (!user || user.status === "SUSPENDED" || user.status === "DELETED") {
      throw new UnauthorizedException("Account is not active.");
    }

    // Device fingerprint check
    const storedFingerprint = (session as any).deviceFingerprint;
    if (storedFingerprint && req) {
      const currentFp = generateDeviceFingerprint(req);
      const comparison = compareFingerprints(storedFingerprint, currentFp.hash);

      if (!comparison.match && comparison.confidence === "low") {
        await this.prisma.session.update({
          where: { id: session.id },
          data: {
            isActive: false,
            revokedAt: new Date(),
            revokedBy: "fingerprint_mismatch",
          },
        });
        throw new UnauthorizedException(
          "Session invalidated — device mismatch detected. Please login again.",
        );
      }
    }

    this.prisma.session
      .update({ where: { id: session.id }, data: { lastActivity: new Date() } })
      .catch(() => {});

    // Session rotation for cookie sessions
    let newToken: string | undefined;
    if (session.sessionType === SessionType.COOKIE) {
      const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
      const sessionDurationMs =
        session.expiresAt.getTime() - session.createdAt.getTime();
      const halfLife = sessionDurationMs / 2;

      if (
        timeUntilExpiry < SESSION_ROTATION_THRESHOLD_MS ||
        timeUntilExpiry < halfLife
      ) {
        const rawNewToken = crypto.randomBytes(32).toString("hex");
        const hashedNewToken = crypto
          .createHash("sha256")
          .update(rawNewToken)
          .digest("hex");
        const newExpiry = new Date(
          Date.now() +
            (session.rememberMe
              ? 30 * 24 * 60 * 60 * 1000
              : 24 * 60 * 60 * 1000),
        );

        await this.prisma.session.update({
          where: { id: session.id },
          data: {
            token: hashedNewToken,
            expiresAt: newExpiry,
            lastActivity: new Date(),
            lastRotatedAt: new Date(),
          },
        });

        newToken = rawNewToken;
      }
    }

    return { user, newToken };
  }
}
