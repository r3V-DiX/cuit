// apps/auth-service/src/auth/services/session.service.ts
//
// CHANGES FROM PREVIOUS VERSION:
//   - Imports now come from @cykruit/auth-core (generateRawToken, hashToken,
//     resolveSessionExpiry, generateDeviceFingerprint, compareFingerprints)
//   - Local device-fingerprint.util.ts import removed (file deleted)
//   - validateAndRotateSession now BLOCKS on low confidence fingerprint mismatch
//     (previously only logged — this is the core security fix)
//   - validateSession now accepts and passes req through the full call chain
//   - resolveExpiry replaced by shared resolveSessionExpiry
//   - generateRawToken replaced by shared generateRawToken
//   - crypto.createHash calls replaced by shared hashToken

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { AuditService, AuditAction } from "@cykruit/audit";
import { SessionType, DeviceType } from "@prisma/client";
import {
  generateRawToken,
  hashToken,
  resolveSessionExpiry,
  generateDeviceFingerprint,
} from "@cykruit/auth-core";
import { getPolicyInt } from "@cykruit/policy-config";
import type { Request } from "express";
import { UAParser } from "ua-parser-js";
import * as geoip from "geoip-lite";

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ── Create ───────────────────────────────────────────────────

  async createSession(
    userId: string,
    rememberMe: boolean,
    userAgent: string,
    ipAddress: string,
    req?: Request,
  ): Promise<string> {
    const rawToken = generateRawToken(64);
    const hashedToken = hashToken(rawToken);

    const deviceType = this.resolveDeviceType(userAgent);
    const expiresAt = await resolveSessionExpiry(rememberMe);

    const fingerprint = req ? generateDeviceFingerprint(req) : null;

    await this.enforceSessionLimit(userId);

    await this.prisma.session.create({
      data: {
        userId,
        token: hashedToken,
        userAgent,
        ipAddress,
        deviceType,
        sessionType: SessionType.COOKIE,
        expiresAt,
        isActive: true,
        lastActivity: new Date(),
        lastRotatedAt: new Date(),
        ...(fingerprint ? { deviceFingerprint: fingerprint.hash } : {}),
      },
    });

    return rawToken;
  }

  // ── Validate & Rotate: moved to SharedSessionValidator (@cykruit/auth-core) ──
  // See docs/SESSION_MEMORY.md — this and 8 other hand-copied implementations
  // were consolidated into one canonical ISessionValidator.

  // ── Delete (logout) ───────────────────────────────────────────

  async deleteSession(rawToken: string): Promise<void> {
    const hashedToken = hashToken(rawToken);

    await this.prisma.session.updateMany({
      where: { token: hashedToken, isActive: true },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: "user_logout",
      },
    });
  }

  // ── Revoke by ID ──────────────────────────────────────────────

  async revokeSession(
    sessionId: string,
    requestingUserId: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== requestingUserId)
      throw new UnauthorizedException("Cannot revoke another user's session");

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: "user_revoke",
      },
    });

    this.auditService.log(
      AuditAction.SESSION_REVOKED,
      "SUCCESS",
      requestingUserId,
      {
        ...reqCtx,
        sessionId,
      },
      { revokedSessionId: sessionId, deviceType: session.deviceType },
    );
  }

  // ── Revoke all others ─────────────────────────────────────────

  async revokeAllOtherSessions(
    userId: string,
    currentSessionToken: string,
    reqCtx?: { ip?: string; userAgent?: string },
  ): Promise<number> {
    const hashedCurrent = hashToken(currentSessionToken);

    const result = await this.prisma.session.updateMany({
      where: { userId, isActive: true, token: { not: hashedCurrent } },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: "user_revoke_all",
      },
    });

    this.auditService.log(
      AuditAction.SESSION_REVOKED_ALL,
      "SUCCESS",
      userId,
      reqCtx,
      {
        revokedCount: result.count,
      },
    );

    return result.count;
  }

  // ── Delete all ────────────────────────────────────────────────

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedBy: "logout_all" },
    });
  }

  // ── List with isCurrent ───────────────────────────────────────

  async listUserSessions(userId: string, currentToken: string) {
    const hashedCurrent = currentToken ? hashToken(currentToken) : null;

    const sessions = await this.prisma.session.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        deviceType: true,
        sessionType: true,
        deviceName: true,
        platform: true,
        appVersion: true,
        createdAt: true,
        lastActivity: true,
        expiresAt: true,
        token: true,
      },
      orderBy: { lastActivity: "desc" },
    });

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      deviceType: s.deviceType,
      sessionType: s.sessionType,
      deviceName: s.deviceName,
      platform: s.platform,
      appVersion: s.appVersion,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
      expiresAt: s.expiresAt,
      isCurrent: hashedCurrent ? s.token === hashedCurrent : false,
      ...this.parseUserAgent(s.userAgent),
      ...this.parseLocation(s.ipAddress),
    }));
  }

  // ── isTokenForSession ─────────────────────────────────────────

  async isTokenForSession(
    rawToken: string,
    sessionId: string,
  ): Promise<boolean> {
    const hashedToken = hashToken(rawToken);
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) return false;
    return session.token === hashedToken;
  }

  // ── Push token update ─────────────────────────────────────────

  async updatePushToken(
    sessionId: string,
    userId: string,
    pushToken: string,
  ): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId)
      throw new UnauthorizedException("Cannot update another user's session");

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { pushToken },
    });
  }

  // ── Private helpers ───────────────────────────────────────────

  private async enforceSessionLimit(userId: string): Promise<void> {
    const maxActiveSessions = await getPolicyInt("max_active_sessions_per_user", 5);
    const sessions = await this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (sessions.length >= maxActiveSessions) {
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

  // ── Login history ─────────────────────────────────────────────

  async getLoginHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        deviceType: true,
        createdAt: true,
        lastActivity: true,
        isActive: true,
        revokedAt: true,
        revokedBy: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await this.prisma.session.count({ where: { userId } });

    return {
      data: sessions.map((s) => ({
        ...s,
        ...this.parseUserAgent(s.userAgent),
        ...this.parseLocation(s.ipAddress),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // ── UA + Geo helpers ──────────────────────────────────────────

  parseUserAgent(rawUa?: string | null) {
    if (!rawUa) return { browserName: "Unknown", osName: "Unknown", deviceLabel: "Unknown device" };
    const p = new UAParser(rawUa);
    const browser = p.getBrowser().name ?? "Unknown";
    const os = p.getOS().name ?? "Unknown";
    const device = p.getDevice().model;
    return {
      browserName: browser,
      osName: os,
      deviceLabel: device ? `${browser} on ${device}` : `${browser} on ${os}`,
    };
  }

  parseLocation(ip?: string | null) {
    if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
      return { city: null, country: null, locationLabel: "Local / Unknown" };
    }
    try {
      const geo = geoip.lookup(ip);
      if (!geo) return { city: null, country: null, locationLabel: "Unknown location" };
      return {
        city: geo.city || null,
        country: geo.country || null,
        locationLabel: [geo.city, geo.country].filter(Boolean).join(", ") || "Unknown location",
      };
    } catch {
      return { city: null, country: null, locationLabel: "Unknown location" };
    }
  }

  private resolveDeviceType(userAgent: string): DeviceType {
    const ua = (userAgent || "").toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    )
      return DeviceType.MOBILE;
    if (ua.includes("tablet") || ua.includes("ipad")) return DeviceType.TABLET;
    return DeviceType.DESKTOP;
  }
}
