import { PrismaService } from "@cykruit/prisma";
import { AppLogger } from "@cykruit/logger";
import { AuditAction, AuditStatus, AuditRequestContext } from "./audit.types";
export declare class AuditService {
  private readonly prisma;
  private readonly logger;
  constructor(prisma: PrismaService, logger: AppLogger);
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
  ): void;
  /**
   * Awaitable version — use when you need to guarantee the log is written
   * before proceeding (e.g. in tests, or for critical compliance events).
   */
  logAsync(
    action: AuditAction,
    status: AuditStatus,
    userId?: string,
    req?: AuditRequestContext,
    metadata?: Record<string, any>,
  ): Promise<void>;
  /**
   * Paginated query — used by GET /auth/audit-log.
   * Returns only safe fields — never sessionId or raw metadata.
   */
  getUserAuditLog(
    userId: string,
    page?: number,
    limit?: number,
    action?: AuditAction,
  ): Promise<{
    logs: {
      userAgent: string;
      id: string;
      createdAt: Date;
      status: string;
      action: string;
      ipAddress: string;
    }[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>;
  private writeLog;
  private sanitizeIp;
  /**
   * Convert raw UA string into a readable label for the UI.
   * e.g. "Mozilla/5.0 (Macintosh; ...) Chrome/120..." → "Chrome on macOS"
   * Falls back to truncated raw string if parsing fails.
   */
  private parseUserAgent;
}
