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
            SEEKER_ONLY_PREFIXES.forEach(p => granted.add(p));
            EMPLOYER_ONLY_PREFIXES.forEach(p => granted.add(p));
            granted.add('*');
            return granted;
        }

        // SEEKER has seeker permissions
        if (ctx.userRole === UserRole.SEEKER) {
            SEEKER_ONLY_PREFIXES.forEach(p => granted.add(p));
            granted.add('seekers:read');
            granted.add('seekers:write');
            granted.add('applications:read');
            granted.add('messages:read');
            granted.add('messages:write');
            return granted;
        }

        // EMPLOYER has employer permissions if they are a member of the employer profile
        if (ctx.userRole === UserRole.EMPLOYER) {
            let isMember = true;
            let memberRole = 'RECRUITER';

            if (ctx.employerId) {
                const member = await this.prisma.employerMember.findUnique({
                    where: {
                        employerId_userId: {
                            employerId: ctx.employerId,
                            userId: ctx.userId,
                        },
                    },
                });
                if (!member) {
                    isMember = false;
                } else {
                    memberRole = member.role;
                }
            }

            if (isMember) {
                if (memberRole === 'VIEWER') {
                    granted.add('applications:read_all');
                } else {
                    EMPLOYER_ONLY_PREFIXES.forEach(p => granted.add(p));
                }
            }
        }

        return granted;
    }

    private accountTypeGate(role: UserRole, action: string): PermissionResult | null {
        if (role === UserRole.ADMIN) return null; // ADMIN passes all gates

        if (role === UserRole.SEEKER) {
            for (const prefix of EMPLOYER_ONLY_PREFIXES) {
                if (action === prefix || action.startsWith(prefix + ':')) return 'DENIED';
            }
        }

        if (role === UserRole.EMPLOYER) {
            for (const prefix of SEEKER_ONLY_PREFIXES) {
                if (action === prefix || action.startsWith(prefix + ':')) return 'DENIED';
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
