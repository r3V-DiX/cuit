import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { findFreePackage } from '../utils/free-package';

export interface EmployerLimits {
    maxActiveJobs: number;
    maxTeamMembers: number;
    featuredJobSlots: number;
    aiScoringEnabled: boolean;
    jobPostingPeriodDays: number;
    resumeViewEnabled: boolean;
    canExportApplicants: boolean;
    analyticsEnabled: boolean;
    prioritySupportEnabled: boolean;
}

export const FREE_LIMITS: EmployerLimits = {
    maxActiveJobs: 1,
    maxTeamMembers: 2,
    featuredJobSlots: 0,
    aiScoringEnabled: false,
    jobPostingPeriodDays: 30,
    resumeViewEnabled: false,
    canExportApplicants: false,
    analyticsEnabled: false,
    prioritySupportEnabled: false,
};

const CACHE_TTL_SECONDS = 120; // 2 minutes

// Bound every Redis command so a slow/down Redis degrades to DB reads instead of
// hanging the request (previously a disconnected ioredis client queued commands
// forever, which made limit-checked endpoints time out at the 30s interceptor).
const REDIS_COMMAND_TIMEOUT_MS = 1000;

@Injectable()
export class EmployerLimitsService {
    private readonly logger = new Logger(EmployerLimitsService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Optional() @Inject('REDIS_CLIENT') private readonly redis: unknown,
    ) {}

    private cacheKey(employerId: string): string {
        return `employer-limits:${employerId}`;
    }

    async resolveForEmployer(employerId: string): Promise<EmployerLimits> {
        const cached = await this.getFromCache(employerId);
        if (cached) return cached;

        const limits = await this.loadFromDb(employerId);
        await this.setInCache(employerId, limits);
        return limits;
    }

    async invalidate(employerId: string): Promise<void> {
        if (!this.isRedisReady()) return;
        try {
            await this.withTimeout(
                (this.redis as { del: (key: string) => Promise<unknown> }).del(this.cacheKey(employerId)),
                undefined,
            );
        } catch (err) {
            this.logger.warn(`Redis cache invalidation failed for employer ${employerId}: ${String(err)}`);
        }
    }

    /** True only when the injected ioredis client is currently connected. When
     *  Redis is down (or was never configured) we skip caching entirely and fall
     *  back to the DB — issuing a command on a disconnected client would queue
     *  forever. */
    private isRedisReady(): boolean {
        if (!this.redis) return false;
        const status = (this.redis as { status?: string }).status;
        return status === 'ready';
    }

    /** Resolve with `fallback` if `promise` does not settle within the budget —
     *  never lets a Redis command hang the request. */
    private withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
        return new Promise<T>((resolve) => {
            const timer = setTimeout(() => resolve(fallback), REDIS_COMMAND_TIMEOUT_MS);
            promise.then(
                (v) => { clearTimeout(timer); resolve(v); },
                () => { clearTimeout(timer); resolve(fallback); },
            );
        });
    }

    private async loadFromDb(employerId: string): Promise<EmployerLimits> {
        const sub = await this.prisma.employerSubscription.findUnique({
            where: { employerId },
            select: {
                status: true,
                expiresAt: true,
                package: {
                    select: {
                        maxActiveJobs: true,
                        maxTeamMembers: true,
                        featuredJobSlots: true,
                        aiScoringEnabled: true,
                        jobPostingPeriodDays: true,
                        resumeViewEnabled: true,
                        canExportApplicants: true,
                        analyticsEnabled: true,
                        prioritySupportEnabled: true,
                    },
                },
            },
        });

        const now = new Date();
        const isActive =
            sub !== null &&
            sub.status === 'ACTIVE' &&
            (sub.expiresAt === null || sub.expiresAt > now);

        if (!isActive || !sub?.package) {
            // Use shared resolver — single source of truth for the Free package
            const freePkg = await findFreePackage(this.prisma);
            if (freePkg) return this.fromPackage(freePkg);
            return FREE_LIMITS;
        }

        return this.fromPackage(sub.package);
    }

    private fromPackage(pkg: {
        maxActiveJobs: number;
        maxTeamMembers: number;
        featuredJobSlots: number;
        aiScoringEnabled: boolean;
        jobPostingPeriodDays: number;
        resumeViewEnabled: boolean;
        canExportApplicants: boolean;
        analyticsEnabled: boolean;
        prioritySupportEnabled: boolean;
    }): EmployerLimits {
        return {
            maxActiveJobs: pkg.maxActiveJobs,
            maxTeamMembers: pkg.maxTeamMembers,
            featuredJobSlots: pkg.featuredJobSlots,
            aiScoringEnabled: pkg.aiScoringEnabled,
            jobPostingPeriodDays: pkg.jobPostingPeriodDays,
            resumeViewEnabled: pkg.resumeViewEnabled,
            canExportApplicants: pkg.canExportApplicants,
            analyticsEnabled: pkg.analyticsEnabled,
            prioritySupportEnabled: pkg.prioritySupportEnabled,
        };
    }

    private async getFromCache(employerId: string): Promise<EmployerLimits | null> {
        if (!this.isRedisReady()) return null;
        try {
            const raw = await this.withTimeout(
                (this.redis as { get: (key: string) => Promise<string | null> }).get(
                    this.cacheKey(employerId),
                ),
                null,
            );
            if (!raw) return null;
            return JSON.parse(raw) as EmployerLimits;
        } catch (err) {
            this.logger.warn(`Redis cache read failed for employer ${employerId}: ${String(err)}`);
            return null;
        }
    }

    private async setInCache(employerId: string, limits: EmployerLimits): Promise<void> {
        if (!this.isRedisReady()) return;
        try {
            await this.withTimeout(
                (
                    this.redis as {
                        setex: (key: string, ttl: number, value: string) => Promise<unknown>;
                    }
                ).setex(this.cacheKey(employerId), CACHE_TTL_SECONDS, JSON.stringify(limits)),
                undefined,
            );
        } catch (err) {
            this.logger.warn(`Redis cache write failed for employer ${employerId}: ${String(err)}`);
        }
    }
}
