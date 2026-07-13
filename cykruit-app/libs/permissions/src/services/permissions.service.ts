// libs/permissions/src/services/permissions.service.ts
// Core permission resolution engine (mocked to use existing Prisma models).

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

// Permissions only SEEKER can use (exact action strings, no prefix trick)
const SEEKER_ONLY_ACTIONS = new Set([
    'seekers:read_profile',
    'seekers:read_contact',
    'applications:read',
    'messages:send',
    'messages:read',
]);

// Permissions only EMPLOYER/ADMIN can use (exact action strings)
const EMPLOYER_ONLY_ACTIONS = new Set([
    'jobs:read',
    'jobs:create',
    'jobs:update',
    'jobs:delete',
    'jobs:publish',
    'jobs:close',
    'company:invite_member',
    'company:remove_member',
    'company:change_role',
    'company:transfer_owner',
    'company:update',
    'company:submit_kyc',
    'company:view_activity',
    'applications:update_status',
    'applications:add_note',
    'applications:read_all',
]);

// Permissions granted to OWNER only
const OWNER_ONLY_ACTIONS = new Set([
    'company:change_role',
    'company:transfer_owner',
]);

// Permissions granted to OWNER + HIRING_MANAGER
const MANAGER_ACTIONS = new Set([
    'company:invite_member',
    'company:remove_member',
    'applications:read_all',
]);

// Permissions granted to OWNER + HIRING_MANAGER + RECRUITER
const RECRUITER_ACTIONS = new Set([
    'jobs:create',
    'jobs:update',
    'jobs:delete',
    'jobs:publish',
    'jobs:close',
    'applications:update_status',
    'applications:add_note',
]);

// Permissions granted to OWNER + HIRING_MANAGER only
const MANAGER_EXCLUSIVE_ACTIONS = new Set([
    'company:update',
    'company:submit_kyc',
]);

// Permissions granted to ALL members including VIEWER
const ALL_MEMBER_ACTIONS = new Set([
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

        // ADMIN has all permissions
        if (ctx.userRole === UserRole.ADMIN) {
            SEEKER_ONLY_ACTIONS.forEach(p => granted.add(p));
            EMPLOYER_ONLY_ACTIONS.forEach(p => granted.add(p));
            granted.add('*');
            return granted;
        }

        // SEEKER has seeker permissions only
        if (ctx.userRole === UserRole.SEEKER) {
            SEEKER_ONLY_ACTIONS.forEach(p => granted.add(p));
            return granted;
        }

        // EMPLOYER: basic reads are available to any EMPLOYER user (e.g. during KYC setup).
        // Role-gated actions require a confirmed EmployerMember row.
        if (ctx.userRole === UserRole.EMPLOYER) {
            ALL_MEMBER_ACTIONS.forEach(p => granted.add(p));

            const member = await this.resolveEmployerMember(ctx.userId, ctx.employerId);
            if (!member) return granted; // no org membership yet — read-only access

            const role = member.role;

            // RECRUITER+
            if (role === 'RECRUITER' || role === 'HIRING_MANAGER' || role === 'OWNER') {
                RECRUITER_ACTIONS.forEach(p => granted.add(p));
            }

            // HIRING_MANAGER+
            if (role === 'HIRING_MANAGER' || role === 'OWNER') {
                MANAGER_ACTIONS.forEach(p => granted.add(p));
                MANAGER_EXCLUSIVE_ACTIONS.forEach(p => granted.add(p));
            }

            // OWNER only
            if (role === 'OWNER') {
                OWNER_ONLY_ACTIONS.forEach(p => granted.add(p));
            }
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
        if (role === UserRole.ADMIN) return null;

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
