// admin-app/src/admin/services/admin-auth-audit.logger.ts
// Writes to AdminAuthAuditLog — the console's own login/logout trail.
// Mirrors AdminAuditLogger's fire-and-forget pattern; kept as a separate
// model/writer from AdminAuditLog so login noise doesn't mix with the
// business-mutation audit trail.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import type { Prisma } from '@prisma/client';

export interface AdminAuthAuditEntry {
    action:
        | 'ADMIN_LOGIN_SUCCESS'
        | 'ADMIN_LOGIN_FAILURE'
        | 'ADMIN_LOGOUT'
        | 'ADMIN_OTP_REQUESTED'
        | 'ADMIN_OTP_REQUEST_FAILED'
        | 'ADMIN_ACCOUNT_ACTIVATED';
    status: 'SUCCESS' | 'FAILURE';
    adminId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AdminAuthAuditLogger {
    constructor(private readonly prisma: PrismaService) {}

    log(entry: AdminAuthAuditEntry): void {
        this.prisma.adminAuthAuditLog.create({
            data: {
                action: entry.action,
                status: entry.status,
                adminId: entry.adminId,
                ipAddress: entry.ipAddress,
                userAgent: entry.userAgent,
                metadata: entry.metadata,
            },
        }).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            console.warn('[AdminAuthAuditLogger] Failed to write audit log:', message);
        });
    }
}
