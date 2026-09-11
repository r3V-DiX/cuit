// libs/permissions/src/services/permissions.service.ts
// Core permission resolution engine (mocked to use existing Prisma models).

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { UserRole } from '@prisma/client';
import { PermissionCacheService } from './permission-cache.service';
import { ALL_EMPLOYER_ACTIONS } from '../employer-rbac.registry';

export interface PermissionContext {
    userId: string;
    userRole: UserRole;    // SEEKER | EMPLOYER
    employerId?: string;   // Company scope for employer-side checks
}

export type PermissionResult = 'GRANTED' | 'DENIED';

// Permissions only SEEKER can use
const SEEKER_ONLY_ACTIONS = new Set([
    'seekers:read_profile',
    'seekers:read_contact',
    'applications:read',
    'messages:send',
    'messages:read',
]);

// Permissions only EMPLOYER can use
const EMPLOYER_ONLY_ACTIONS = new Set<string>(ALL_EMPLOYER_ACTIONS);

// Granted to any EMPLOYER account even before they have an EmployerMember row
// (e.g. mid-KYC-setup, before the company/org exists yet). Intentionally not
// part of the admin-editable role matrix — this is a bootstrap allowance, not
// a role grant, so an admin zeroing out VIEWER's permissions can't lock a
// brand-new employer out of their own setup flow.
const PRE_MEMBERSHIP_ACTIONS = new Set([
    'company:read',
    'company:view_activity',
    'jobs:read',
]);

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

        // 2. Resolve permissions set
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

        // SEEKER has seeker permissions only
        if (ctx.userRole === UserRole.SEEKER) {
            SEEKER_ONLY_ACTIONS.forEach(p => granted.add(p));
            return granted;
        }

        // EMPLOYER: role-gated actions require a confirmed EmployerMember row.
        if (ctx.userRole === UserRole.EMPLOYER) {
            const member = await this.resolveEmployerMember(ctx.userId, ctx.employerId);
            if (!member) {
                PRE_MEMBERSHIP_ACTIONS.forEach(p => granted.add(p));
                return granted;
            }

            const rolePermissions = await this.prisma.employerRolePermission.findMany({
                where: { role: member.role, permission: { isActive: true } },
                select: { permission: { select: { module: true, action: true } } },
            });
            rolePermissions.forEach(({ permission }) => granted.add(`${permission.module}:${permission.action}`));
        }

        return granted;
    }

    /**
     * Resolves the EmployerMember row for a user.
     * If employerId is provided, scopes to that org.
     * If not provided, looks up their org from any membership (single-org assumption).
     */
    private async resolveEmployerMember(userId: string, employerId?: string) {
        if (employerId) {
            return this.prisma.employerMember.findUnique({
                where: { employerId_userId: { employerId, userId } },
            });
        }
        // No employerId on request — find their org membership (EMPLOYER users belong to one org)
        return this.prisma.employerMember.findFirst({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    private accountTypeGate(role: UserRole, action: string): PermissionResult | null {
        if (role === UserRole.SEEKER && EMPLOYER_ONLY_ACTIONS.has(action)) return 'DENIED';
        if (role === UserRole.EMPLOYER && SEEKER_ONLY_ACTIONS.has(action)) return 'DENIED';

        return null;
    }

    async invalidateUserCache(userId: string, employerId?: string): Promise<void> {
        await this.cache.invalidate(userId, employerId);
    }

    async invalidateCompanyCache(employerId: string): Promise<void> {
        await this.cache.invalidateAllForEmployer(employerId);
    }
}
