// libs/audit/src/audit.service.ts
//
// Design principles:
//   - Fire-and-forget: auth flows never await audit writes
//   - Never throws: audit failure must not break auth
//   - Never logs passwords, raw tokens, or PII beyond userId/IP
//   - userAgent truncated to 255 chars always
//   - userId nullable: failed logins for unknown emails still get recorded

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { AppLogger } from "@cykruit/logger";
import { AuditAction, AuditStatus, AuditRequestContext, SystemAuditEntry } from "./audit.types";

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Record a security-relevant auth event.
   *
   * This method is intentionally fire-and-forget — callers do NOT await it.
   * Audit failures are logged as warnings but never propagate to the caller.
   *
   * @example
   * // In auth.service.ts login():
   * this.auditService.log(AuditAction.LOGIN_SUCCESS, 'SUCCESS', user.id, { ip, userAgent });
   */
  log(
    action: AuditAction,
    status: AuditStatus,
    userId?: string,
    req?: AuditRequestContext,
    metadata?: Record<string, any>,
  ): void {
    // Fire and forget — intentionally not awaited
    this.writeLog(action, status, userId, req, metadata).catch((err) => {
      // Audit write failure must NEVER break auth flows
      this.logger.warn(
        `[AUDIT_WRITE_FAILED] action:${action} uid:${userId ?? "unknown"} err:${err?.message}`,
        "AuditService",
      );
    });
  }

  /**
   * Awaitable version — use when you need to guarantee the log is written
   * before proceeding (e.g. in tests, or for critical compliance events).
   */
  async logAsync(
    action: AuditAction,
    status: AuditStatus,
    userId?: string,
    req?: AuditRequestContext,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.writeLog(action, status, userId, req, metadata);
  }

  /**
   * Record a business-action event (job posted, KYC submitted, profile
   * edited, etc.) to the generic AuditLog model — the "System Logs" source
   * for admin-ui, distinct from the auth-only AuthAuditLog above.
   *
   * Fire-and-forget, same guarantee as log(): never throws, never blocks
   * the caller's request on a write failure.
   */
  logAction(entry: SystemAuditEntry): void {
    this.prisma.auditLog
      .create({
        data: {
          actorId: entry.actorId,
          actorRole: entry.actorRole,
          action: entry.action,
          module: entry.module,
          targetType: entry.targetType,
          targetId: entry.targetId,
          oldData: entry.oldData,
          newData: entry.newData,
          riskLevel: entry.riskLevel ?? "LOW",
          result: entry.result,
          reason: entry.reason,
          ipAddress: entry.ipAddress,
          metadata: entry.metadata,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `[AUDIT_WRITE_FAILED] action:${entry.action} actor:${entry.actorId} err:${err?.message}`,
          "AuditService",
        );
      });
  }

  /**
   * Paginated query — used by GET /auth/audit-log.
   * Returns only safe fields — never sessionId or raw metadata.
   */
  async getUserAuditLog(
    userId: string,
    page = 1,
    limit = 20,
    action?: AuditAction,
  ) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where = {
      userId,
      ...(action ? { action } : {}),
    };

    const [logs, total] = await Promise.all([
      this.prisma.authAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit,
        select: {
          id: true,
          action: true,
          status: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          // ✅ Never expose: userId, sessionId, raw metadata
        },
      }),
      this.prisma.authAuditLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({
        ...l,
        // Truncate userAgent for display — full UA is ugly in UI
        userAgent: l.userAgent ? this.parseUserAgent(l.userAgent) : null,
      })),
      pagination: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        hasNextPage: page < Math.ceil(total / safeLimit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // ── Private ───────────────────────────────────────────────────

  private async writeLog(
    action: AuditAction,
    status: AuditStatus,
    userId?: string,
    req?: AuditRequestContext,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.prisma.authAuditLog.create({
      data: {
        action,
        status,
        userId: userId ?? null,
        ipAddress: req?.ip ? this.sanitizeIp(req.ip) : null,
        userAgent: req?.userAgent ? req.userAgent.substring(0, 255) : null,
        sessionId: req?.sessionId ?? null,
        metadata: metadata ?? null,
      },
    });
  }

  private sanitizeIp(ip: string): string {
    if (!ip) return "unknown";
    // Normalize IPv4-mapped IPv6 (::ffff:1.2.3.4 → 1.2.3.4)
    if (ip.startsWith("::ffff:")) return ip.slice(7);
    return ip;
  }

  /**
   * Convert raw UA string into a readable label for the UI.
   * e.g. "Mozilla/5.0 (Macintosh; ...) Chrome/120..." → "Chrome on macOS"
   * Falls back to truncated raw string if parsing fails.
   */
  private parseUserAgent(ua: string): string {
    try {
      if (ua.includes("iPhone") || ua.includes("iPad")) {
        const match = ua.match(/CPU (?:iPhone )?OS ([\d_]+)/);
        const version = match ? ` ${match[1].replace(/_/g, ".")}` : "";
        return `Safari on iOS${version}`;
      }
      if (ua.includes("Android")) {
        if (ua.includes("Chrome")) return "Chrome on Android";
        return "Browser on Android";
      }
      if (ua.includes("Macintosh")) {
        if (ua.includes("Chrome") && !ua.includes("Edg"))
          return "Chrome on macOS";
        if (ua.includes("Firefox")) return "Firefox on macOS";
        if (ua.includes("Safari") && !ua.includes("Chrome"))
          return "Safari on macOS";
        if (ua.includes("Edg")) return "Edge on macOS";
        return "Browser on macOS";
      }
      if (ua.includes("Windows")) {
        if (ua.includes("Chrome") && !ua.includes("Edg"))
          return "Chrome on Windows";
        if (ua.includes("Firefox")) return "Firefox on Windows";
        if (ua.includes("Edg")) return "Edge on Windows";
        return "Browser on Windows";
      }
      if (ua.includes("Linux")) {
        if (ua.includes("Chrome")) return "Chrome on Linux";
        if (ua.includes("Firefox")) return "Firefox on Linux";
        return "Browser on Linux";
      }
      if (ua === "unknown") return "Unknown device";
      return ua.substring(0, 50);
    } catch {
      return ua.substring(0, 50);
    }
  }
}
