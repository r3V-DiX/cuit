// admin-app/src/admin/services/admin-audit.logger.ts
// Writes to the general AuditLog model (not AuthAuditLog which is auth-service-specific).

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';

export interface AdminAuditEntry {
    actorId: string;
    actorRole?: string;
    action: string;
    module: string;
    targetType?: string;
    targetId?: string;
    oldData?: any;
    newData?: any;
    riskLevel?: string;
    result: string;
    reason?: string;
    ipAddress?: string;
    metadata?: any;
}

@Injectable()
export class AdminAuditLogger {
    constructor(private readonly prisma: PrismaService) {}

    log(entry: AdminAuditEntry): void {
        this.prisma.auditLog.create({
            data: {
                actorId: entry.actorId,
                actorRole: entry.actorRole ?? 'ADMIN',
                action: entry.action,
                module: entry.module,
                targetType: entry.targetType,
                targetId: entry.targetId,
                oldData: entry.oldData,
                newData: entry.newData,
                riskLevel: entry.riskLevel ?? 'LOW',
                result: entry.result,
                reason: entry.reason,
                ipAddress: entry.ipAddress,
                metadata: entry.metadata,
            },
        }).catch((err) => {
            console.warn('[AdminAuditLogger] Failed to write audit log:', err?.message ?? err);
        });
    }
}
