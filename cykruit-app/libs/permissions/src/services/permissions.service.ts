// libs/permissions/src/services/permissions.service.ts
// Core permission resolution engine.
//
// Check order:
//   1. Account type gate  (SEEKER cannot use employer actions — fast path)
//   2. Super-admin        (ADMIN with SUPER_ADMIN role = all permissions granted)
//   3. Force-deny override (UserPermissionOverride.grant=false, scoped or global)
//   4. Force-grant override (UserPermissionOverride.grant=true)
//   5. Company-scoped role (UserRoleAssignment where employerId matches)
//   6. Global role         (UserRoleAssignment where employerId is null)
//   → DENIED if nothing grants

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { UserRole } from '@prisma/client';
import { PermissionCacheService } from './permission-cache.service';

export interface PermissionContext {
    userId: string;
    userRole: UserRole;    // SEEKER | EMPLOYER | ADMIN
    employerId?: string;   // Company scope for employer-side checks
}

export type PermissionResult = 'GRANTED' | 'DENIED';

// Permissions only SEEKER can use
const SEEKER_ONLY_PREFIXES = ['seekers:', 'applications:read', 'messages:'];
// Permissions only EMPLOYER/ADMIN can use
const EMPLOYER_ONLY_PREFIXES = ['jobs:create', 'jobs:update', 'jobs:delete', 'jobs:publish', 'jobs:close', 'company:invite', 'company:remove', 'company:change_role', 'company:transfer', 'applications:update_status', 'applications:add_note', 'applications:read_all'];

@Injectable()
export class PermissionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: PermissionCacheService,
    ) {}

    async check(ctx: PermissionContext, action: string): Promise<PermissionResult> {
        // 1. Account type gate
        const typeGate = this.accountTypeGate(ctx.userRole, action);
        if (typeGate === 'DENIED') return 'DENIED';

        // 2. Resolve full permission set (cached)
        const perms = await this.resolvePermissions(ctx);
        return perms.has(action) ? 'GRANTED' : 'DENIED';
    }

    async checkMany(ctx: PermissionContext, actions: string[]): Promise<Record<string, PermissionResult>> {
        const perms = await this.resolvePermissions(ctx);
        return Object.fromEntries(
            actions.map((a) => [a, perms.has(a) ? 'GRANTED' : 'DENIED']),
        );
    }

    async resolvePermissions(ctx: PermissionContext): Promise<Set<string>> {
        const cached = await this.cache.get(ctx.userId, ctx.employerId);
        if (cached) return cached;

        const resolved = await this.buildPermissionSet(ctx);
        await this.cache.set(ctx.userId, resolved, ctx.employerId);
        return resolved;
    }

    private async buildPermissionSet(ctx: PermissionContext): Promise<Set<string>> {
        const granted = new Set<string>();
        const forceDenied = new Set<string>();

        // 2. Super-admin short-circuit
        if (ctx.userRole === UserRole.ADMIN) {
            const isSuperAdmin = await this.isSuperAdmin(ctx.userId);
            if (isSuperAdmin) {
                // All permissions
                const all = await this.prisma.permission.findMany({ where: { isActive: true }, select: { module: true, action: true } });
                all.forEach((p) => granted.add(`${p.module}:${p.action}`));
                return granted;
            }
        }

        // 3 & 4. Permission overrides (force deny/grant) — scoped first, then global
        const overrides = await this.prisma.userPermissionOverride.findMany({
            where: {
                userId: ctx.userId,
                OR: [
                    { employerId: ctx.employerId ?? null },
                    { employerId: null },
                ],
            },
            include: { permission: { select: { module: true, action: true } } },
        });

        for (const o of overrides) {
            const key = `${o.permission.module}:${o.permission.action}`;
            if (!o.grant) {
                forceDenied.add(key);
            } else {
                // Force-grant only applies if not force-denied at a more specific scope
                // (company scope beats global scope)
                if (!forceDenied.has(key)) {
                    granted.add(key);
                }
            }
        }

        // 5 & 6. Role-based permissions — company-scoped then global
        const assignments = await this.prisma.userRoleAssignment.findMany({
            where: {
                userId: ctx.userId,
                AND: [
                    {
                        OR: [
                            { employerId: ctx.employerId ?? null },
                            { employerId: null },
                        ],
                    },
                    {
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } },
                        ],
                    },
                ],
            } as any,
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: { select: { module: true, action: true, isActive: true } } },
                        },
                    },
                },
            },
        });

        for (const assignment of assignments) {
            for (const rp of assignment.role.permissions) {
                if (!rp.permission.isActive) continue;
                const key = `${rp.permission.module}:${rp.permission.action}`;
                if (!forceDenied.has(key)) {
                    granted.add(key);
                }
            }
        }

        return granted;
    }

    private async isSuperAdmin(userId: string): Promise<boolean> {
        const count = await this.prisma.userRoleAssignment.count({
            where: {
                userId,
                role: { name: 'SUPER_ADMIN', isActive: true },
            },
        });
        return count > 0;
    }

    private accountTypeGate(role: UserRole, action: string): PermissionResult | null {
        if (role === UserRole.ADMIN) return null; // ADMIN passes all gates

        if (role === UserRole.SEEKER) {
            for (const prefix of EMPLOYER_ONLY_PREFIXES) {
                if (action.startsWith(prefix)) return 'DENIED';
            }
        }

        if (role === UserRole.EMPLOYER) {
            for (const prefix of SEEKER_ONLY_PREFIXES) {
                if (action.startsWith(prefix)) return 'DENIED';
            }
        }

        return null;
    }

    async invalidateUserCache(userId: string, employerId?: string): Promise<void> {
        await this.cache.invalidate(userId, employerId);
    }

    async invalidateCompanyCache(employerId: string): Promise<void> {
        await this.cache.invalidateAllForEmployer(employerId);
    }
}
