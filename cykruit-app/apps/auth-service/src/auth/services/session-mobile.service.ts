// apps/auth-service/src/auth/services/session-mobile.service.ts
//
// CHANGES FROM PREVIOUS VERSION:
//   - generateRawToken import removed (was from local auth.utils.ts)
//   - Now uses generateRawToken + hashToken from @cykruit/auth-core
//   - No fingerprint logic here — mobile uses JWT, not cookie sessions
//   - Everything else unchanged

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@cykruit/prisma";
import { AppLogger } from "@cykruit/logger";
import { HashService, ErrorCodes } from "@cykruit/common";
import { AuditService, AuditAction } from "@cykruit/audit";
import { SessionType, DeviceType, type User } from "@prisma/client";
import { generateRawToken, hashToken } from "@cykruit/auth-core"; // ✅ shared utils
import { DeviceInfo } from "../types/session.types";
import * as jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const ACCESS_TOKEN_EXPIRY_STR = "15m";
const MAX_MOBILE_SESSIONS = 10;

@Injectable()
export class SessionMobileService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly logger: AppLogger,
  ) {
    this.jwtSecret =
      this.configService.get<string>("JWT_SECRET") || "fallback-secret";
  }

  // ── Create mobile session ─────────────────────────────────────

  async createMobileSession(
    userId: string,
    user: User,
    ipAddress: string,
    deviceInfo?: DeviceInfo,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'isEmailVerified' | 'profileImage'>;
  }> {
    await this.enforceMobileSessionLimit(userId);

    const rawRefreshToken = generateRawToken(64); // ✅ shared util
    const hashedRefreshToken = hashToken(rawRefreshToken); // ✅ shared util

    const jti = generateRawToken(16);

    const accessToken = jwt.sign(
      { sub: userId, email: user.email, role: user.role, jti },
      this.jwtSecret,
      {
        expiresIn: ACCESS_TOKEN_EXPIRY_STR,
        issuer: "cykruit-auth",
        audience: "cykruit-app",
      },
    );

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.session.create({
      data: {
        userId,
        token: hashedRefreshToken,
        userAgent: deviceInfo?.deviceName || "mobile",
        ipAddress,
        deviceType: (deviceInfo?.deviceType as DeviceType | undefined) ?? DeviceType.MOBILE,
        sessionType: SessionType.JWT,
        deviceName: deviceInfo?.deviceName,
        platform: deviceInfo?.platform,
        appVersion: deviceInfo?.appVersion,
        pushToken: deviceInfo?.pushToken,
        expiresAt,
        isActive: true,
        lastActivity: new Date(),
        refreshTokenHash: hashedRefreshToken,
        accessTokenJti: jti,
      },
    });

    this.auditService.log(
      AuditAction.MOBILE_LOGIN,
      "SUCCESS",
      userId,
      {
        ip: ipAddress,
        userAgent: deviceInfo?.deviceName || "mobile",
      },
      {
        platform: deviceInfo?.platform,
        appVersion: deviceInfo?.appVersion,
      },
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profileImage: user.profileImage ?? null,
      },
    };
  }

  // ── Refresh mobile token ──────────────────────────────────────

  async refreshMobileToken(
    rawRefreshToken: string,
    ipAddress: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const hashedRefreshToken = hashToken(rawRefreshToken); // ✅ shared util

    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: hashedRefreshToken,
        isActive: true,
        sessionType: SessionType.JWT,
      },
      include: { user: true },
    });

    if (!session) throw new UnauthorizedException(ErrorCodes.INVALID_TOKEN);

    if (session.expiresAt && new Date() > session.expiresAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isActive: false, revokedAt: new Date(), revokedBy: "expiry" },
      });
      throw new UnauthorizedException(ErrorCodes.TOKEN_EXPIRED);
    }

    const newJti = generateRawToken(16); // ✅ shared util
    const accessToken = jwt.sign(
      {
        sub: session.userId,
        email: session.user.email,
        role: session.user.role,
        jti: newJti,
      },
      this.jwtSecret,
      {
        expiresIn: ACCESS_TOKEN_EXPIRY_STR,
        issuer: "cykruit-auth",
        audience: "cykruit-app",
      },
    );

    // Rotate refresh token on every use — stolen token can't be replayed
    const newRawRefreshToken = generateRawToken(32);
    const newRefreshTokenHash = hashToken(newRawRefreshToken);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        accessTokenJti: newJti,
        refreshTokenHash: newRefreshTokenHash,
        lastActivity: new Date(),
        ipAddress,
      },
    });

    this.auditService.log(
      AuditAction.MOBILE_TOKEN_REFRESHED,
      "SUCCESS",
      session.userId,
      {
        ip: ipAddress,
        userAgent,
        sessionId: session.id,
      },
    );

    return { accessToken, refreshToken: newRawRefreshToken, expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS };
  }

  // ── Find session by refresh token hash ────────────────────────

  async findSessionByRefreshHash(rawRefreshToken: string, userId: string) {
    const hashedRefreshToken = hashToken(rawRefreshToken); // ✅ shared util

    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: hashedRefreshToken,
        userId,
        isActive: true,
        sessionType: SessionType.JWT,
      },
    });

    return session;
  }

  // ── Revoke mobile session ─────────────────────────────────────

  async revokeMobileSession(
    userId: string,
    sessionId: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId)
      throw new UnauthorizedException("Cannot revoke another user's session");

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: "mobile_logout",
      },
    });

    this.auditService.log(AuditAction.MOBILE_LOGOUT, "SUCCESS", userId, {
      ...reqCtx,
      sessionId,
    });
  }

  // ── Private helpers ───────────────────────────────────────────

  private async enforceMobileSessionLimit(userId: string): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        deviceType: DeviceType.MOBILE,
        sessionType: SessionType.JWT,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (sessions.length >= MAX_MOBILE_SESSIONS) {
      await this.prisma.session.update({
        where: { id: sessions[0].id },
        data: {
          isActive: false,
          revokedAt: new Date(),
          revokedBy: "session_limit",
        },
      });
    }
  }
}
