// admin-app/src/admin/services/permissions.service.ts
// Deny-by-default RBAC evaluation pipeline (docs/admin-ui/BACKEND-SCHEMA-admin-ui.md §5):
// super_admin bypass → explicit deny override → explicit grant override →
// role permission → 403 + DENIED AdminAuditLog entry.
// Operates on the console's own Admin* tables (AdminRoleAssignment / AdminPermissionOverride).

import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { AdminAuditLogger } from '../loggers/admin-audit.logger';
import { Action, SUPER_ADMIN_ROLE, splitAction } from '../rbac/permissions.registry';

export interface ResolvedPermissions {
    roles: string[];
    isSuperAdmin: boolean;
    /** Effective allowed actions: role grants + grant overrides, minus deny overrides. */
    permissions: Set<string>;
    /** Explicitly denied actions (deny always wins). */
    denied: Set<string>;
}

interface CacheEntry {
    resolved: ResolvedPermissions;
    expiresAt: number;
}

/** Short TTL so RBAC edits propagate quickly; RbacService also clears on mutation. */
const CACHE_TTL_MS = 15_000;

@Injectable()
export class PermissionsService {
    private readonly cache = new Map<string, CacheEntry>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    /** Drop cached resolutions (called by RbacService after role/override mutations). */
    clearCache(adminId?: string): void {
        if (adminId) this.cache.delete(adminId);
        else this.cache.clear();
    }

    async resolveUserPermissions(adminId: string): Promise<ResolvedPermissions> {
        const hit = this.cache.get(adminId);
        if (hit && hit.expiresAt > Date.now()) return hit.resolved;

        const now = new Date();

        const [admin, assignments, overrides] = await Promise.all([
            this.prisma.admin.findUnique({
                where: { id: adminId },
                select: { email: true },
            }),
            this.prisma.adminRoleAssignment.findMany({
                where: {
                    adminId,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                    role: { isActive: true },
                },
                select: {
                    role: {
                        select: {
                            name: true,
                            permissions: {
                                select: {
                                    permission: { select: { module: true, action: true, isActive: true } },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.adminPermissionOverride.findMany({
                where: { adminId },
                select: {
                    grant: true,
                    permission: { select: { module: true, action: true, isActive: true } },
                },
            }),
        ]);

        const bootstrapEmail = (process.env.RBAC_BOOTSTRAP_ADMIN_EMAIL || 'admin@cykruit.com').toLowerCase();
        const isBootstrapAdmin = !!(admin?.email && admin.email.toLowerCase() === bootstrapEmail);

        const roles = assignments.map((a) => a.role.name);
        if (isBootstrapAdmin && !roles.includes(SUPER_ADMIN_ROLE)) {
            roles.push(SUPER_ADMIN_ROLE);
        }
        const isSuperAdmin = isBootstrapAdmin || roles.includes(SUPER_ADMIN_ROLE);

        const permissions = new Set<string>();
        for (const assignment of assignments) {
            for (const rp of assignment.role.permissions) {
                if (rp.permission.isActive) {
                    permissions.add(`${rp.permission.module}:${rp.permission.action}`);
                }
            }
        }

        const denied = new Set<string>();
        for (const override of overrides) {
            if (!override.permission.isActive) continue;
            const action = `${override.permission.module}:${override.permission.action}`;
            if (override.grant) {
                permissions.add(action);
            } else {
                denied.add(action);
                permissions.delete(action); // deny always wins
            }
        }

        const resolved: ResolvedPermissions = { roles, isSuperAdmin, permissions, denied };
        this.cache.set(adminId, { resolved, expiresAt: Date.now() + CACHE_TTL_MS });
        return resolved;
    }

    /**
     * Deny-by-default check. Throws ForbiddenException (and writes a DENIED
     * audit entry) unless the pipeline allows the action.
     */
    async checkOrThrow(adminId: string, action: Action, ipAddress?: string): Promise<void> {
        const resolved = await this.resolveUserPermissions(adminId);

        // ① super_admin bypass
        if (resolved.isSuperAdmin) return;

        // ② explicit deny override — highest precedence after bypass
        if (resolved.denied.has(action)) {
            this.logDenied(adminId, action, 'Explicitly revoked by permission override', ipAddress);
            throw new ForbiddenException('This permission has been explicitly revoked');
        }

        // ③ explicit grant override / ④ role permission (both folded into the effective set)
        if (resolved.permissions.has(action)) return;

        // ⑤ deny by default
        this.logDenied(adminId, action, 'No role or override grants this permission', ipAddress);
        throw new ForbiddenException('You do not have permission to perform this action');
    }

    private logDenied(adminId: string, action: Action, reason: string, ipAddress?: string): void {
        const { module } = splitAction(action);
        this.auditLogger.log({
            adminId,
            action,
            module,
            riskLevel: 'MEDIUM',
            result: 'DENIED',
            reason,
            ipAddress,
        });
    }
}
