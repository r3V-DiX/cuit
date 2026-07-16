import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';

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

const FREE_LIMITS: EmployerLimits = {
    maxActiveJobs: 3,
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
        if (!this.redis) return;
        try {
            await (this.redis as { del: (key: string) => Promise<unknown> }).del(this.cacheKey(employerId));
        } catch (err) {
            this.logger.warn(`Redis cache invalidation failed for employer ${employerId}: ${String(err)}`);
        }
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
            // Fallback: read Free plan values from DB so admin changes are respected
            const freePkg = await this.prisma.subscriptionPackage.findFirst({
                where: { name: 'Free', isActive: true },
            });
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
        if (!this.redis) return null;
        try {
            const raw = await (this.redis as { get: (key: string) => Promise<string | null> }).get(
                this.cacheKey(employerId),
            );
            if (!raw) return null;
            return JSON.parse(raw) as EmployerLimits;
        } catch (err) {
            this.logger.warn(`Redis cache read failed for employer ${employerId}: ${String(err)}`);
            return null;
        }
    }

    private async setInCache(employerId: string, limits: EmployerLimits): Promise<void> {
        if (!this.redis) return;
        try {
            await (
                this.redis as {
                    setex: (key: string, ttl: number, value: string) => Promise<unknown>;
                }
            ).setex(this.cacheKey(employerId), CACHE_TTL_SECONDS, JSON.stringify(limits));
        } catch (err) {
            this.logger.warn(`Redis cache write failed for employer ${employerId}: ${String(err)}`);
        }
    }
}
