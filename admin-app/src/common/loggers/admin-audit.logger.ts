// admin-app/src/admin/services/admin-audit.logger.ts
// Writes to AdminAuditLog — the console's own audit trail.
// The main app's AuditLog is reserved for platform-side actors and is never touched here.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import type { Prisma } from '@prisma/client';

export interface AdminAuditEntry {
    adminId: string;
    action: string;
    module: string;
    resource?: string;
    resourceId?: string;
    oldData?: Prisma.InputJsonValue;
    newData?: Prisma.InputJsonValue;
    riskLevel?: string;
    result: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AdminAuditLogger {
    constructor(private readonly prisma: PrismaService) {}

    log(entry: AdminAuditEntry): void {
        this.prisma.adminAuditLog.create({
            data: {
                adminId: entry.adminId,
                action: entry.action,
                module: entry.module,
                resource: entry.resource,
                resourceId: entry.resourceId,
                oldData: entry.oldData,
                newData: entry.newData,
                riskLevel: entry.riskLevel ?? 'LOW',
                result: entry.result,
                reason: entry.reason,
                ipAddress: entry.ipAddress,
                userAgent: entry.userAgent,
                metadata: entry.metadata,
            },
        }).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            console.warn('[AdminAuditLogger] Failed to write audit log:', message);
        });
    }
}
