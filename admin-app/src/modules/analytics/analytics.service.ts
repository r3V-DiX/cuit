// admin-app/src/modules/analytics/analytics.service.ts

import { Inject, Injectable, Optional } from '@nestjs/common';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { Period } from './dto/analytics.dto';

type RedisLike = {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, mode: 'EX', ttl: number) => Promise<unknown>;
};

const CACHE_TTL_SECONDS = 300;

function periodToSince(period: Period): Date {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    return since;
}

@Injectable()
export class AnalyticsService {
    constructor(
        private readonly prisma: PrismaService,
        @Optional() @Inject(getRedisConnectionToken()) private readonly redis: RedisLike | null,
    ) {}

    private async getCached<T>(key: string): Promise<T | null> {
        if (!this.redis) return null;
        try {
            const raw = await this.redis.get(key);
            return raw ? (JSON.parse(raw) as T) : null;
        } catch {
            return null;
        }
    }

    private async setCached(key: string, value: unknown): Promise<void> {
        if (!this.redis) return;
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
        } catch {
            // non-fatal — cache is a performance optimization, not a correctness dependency
        }
    }

    async getRevenue(period: Period) {
        const cacheKey = `analytics:revenue:${period}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const since = periodToSince(period);

        const [activeSubs, byPlanRaw, dailyRaw] = await Promise.all([
            this.prisma.employerSubscription.findMany({
                where: { status: 'ACTIVE' },
                select: {
                    billingCycle: true,
                    package: { select: { priceMonthly: true, priceYearly: true } },
                },
            }),
            this.prisma.paymentOrder.groupBy({
                by: ['packageId'],
                where: { status: 'PAID', updatedAt: { gte: since } },
                _sum: { totalAmountPaise: true },
            }),
            this.prisma.$queryRaw<{ date: Date; revenuepaise: bigint }[]>(Prisma.sql`
                SELECT date_trunc('day', "updatedAt") as date, COALESCE(SUM("totalAmountPaise"), 0)::bigint as revenuepaise
                FROM payment_orders
                WHERE status = 'PAID' AND "updatedAt" >= ${since}
                GROUP BY 1 ORDER BY 1
            `),
        ]);

        // MRR: each active subscription's package price normalized to a monthly figure
        // (yearly plans divided by 12). priceMonthly/priceYearly are stored in rupees.
        const mrr = activeSubs.reduce((sum, s) => {
            const monthly =
                s.billingCycle === 'YEARLY'
                    ? Number(s.package.priceYearly ?? 0) / 12
                    : Number(s.package.priceMonthly ?? 0);
            return sum + monthly;
        }, 0);

        const packageIds = byPlanRaw.map((r) => r.packageId);
        const packages = await this.prisma.subscriptionPackage.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true },
        });
        const nameById = new Map(packages.map((p) => [p.id, p.name]));

        const result = {
            period,
            mrr: Math.round(mrr),
            totalRevenuePaise: byPlanRaw.reduce((s, r) => s + (r._sum.totalAmountPaise ?? 0), 0),
            byPlan: byPlanRaw.map((r) => ({
                package: nameById.get(r.packageId) ?? 'Unknown',
                revenuePaise: r._sum.totalAmountPaise ?? 0,
            })),
            daily: dailyRaw.map((r) => ({
                date: r.date.toISOString().slice(0, 10),
                revenuePaise: Number(r.revenuepaise),
            })),
        };

        await this.setCached(cacheKey, result);
        return result;
    }

    async getSubscriptions(period: Period) {
        const cacheKey = `analytics:subscriptions:${period}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const since = periodToSince(period);

        // "Churned" has no dedicated status-change timestamp on EmployerSubscription —
        // updatedAt is the closest proxy (bumped whenever status flips off ACTIVE).
        const [newCount, churnedCount, byPlanRaw] = await Promise.all([
            this.prisma.employerSubscription.count({ where: { startedAt: { gte: since } } }),
            this.prisma.employerSubscription.count({
                where: { status: { not: 'ACTIVE' }, updatedAt: { gte: since } },
            }),
            this.prisma.employerSubscription.groupBy({
                by: ['packageId'],
                where: { status: 'ACTIVE' },
                _count: { id: true },
            }),
        ]);

        const packageIds = byPlanRaw.map((r) => r.packageId);
        const packages = await this.prisma.subscriptionPackage.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true },
        });
        const nameById = new Map(packages.map((p) => [p.id, p.name]));

        const result = {
            period,
            newCount,
            churnedCount,
            netChange: newCount - churnedCount,
            byPlan: byPlanRaw.map((r) => ({
                package: nameById.get(r.packageId) ?? 'Unknown',
                count: r._count.id,
            })),
        };

        await this.setCached(cacheKey, result);
        return result;
    }

    async getUsers(period: Period) {
        const cacheKey = `analytics:users:${period}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const since = periodToSince(period);
        const rows = await this.prisma.$queryRaw<{ date: Date; role: string; count: bigint }[]>(Prisma.sql`
            SELECT date_trunc('day', "createdAt") as date, role, count(*)::bigint as count
            FROM users
            WHERE "createdAt" >= ${since}
            GROUP BY 1, 2 ORDER BY 1
        `);

        const byDate = new Map<string, { date: string; seekers: number; employers: number }>();
        for (const r of rows) {
            const key = r.date.toISOString().slice(0, 10);
            const entry = byDate.get(key) ?? { date: key, seekers: 0, employers: 0 };
            if (r.role === 'SEEKER') entry.seekers = Number(r.count);
            else entry.employers = Number(r.count);
            byDate.set(key, entry);
        }

        const result = { period, daily: Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)) };
        await this.setCached(cacheKey, result);
        return result;
    }

    async getJobs(period: Period) {
        const cacheKey = `analytics:jobs:${period}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const since = periodToSince(period);
        // Bucketed by createdAt + current status (not a true event-time history —
        // Job has no separate approvedAt/rejectedAt/expiredAt columns).
        const rows = await this.prisma.$queryRaw<{ date: Date; bucket: string; count: bigint }[]>(Prisma.sql`
            SELECT date_trunc('day', "createdAt") as date,
                CASE
                    WHEN status IN ('DRAFT', 'PENDING') THEN 'pending'
                    WHEN status = 'APPROVED' THEN 'approved'
                    WHEN status = 'REJECTED' THEN 'rejected'
                    ELSE 'expired'
                END as bucket,
                count(*)::bigint as count
            FROM jobs
            WHERE "createdAt" >= ${since}
            GROUP BY 1, 2 ORDER BY 1
        `);

        const byDate = new Map<
            string,
            { date: string; pending: number; approved: number; rejected: number; expired: number }
        >();
        for (const r of rows) {
            const key = r.date.toISOString().slice(0, 10);
            const entry = byDate.get(key) ?? { date: key, pending: 0, approved: 0, rejected: 0, expired: 0 };
            entry[r.bucket as 'pending' | 'approved' | 'rejected' | 'expired'] = Number(r.count);
            byDate.set(key, entry);
        }

        const result = { period, daily: Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)) };
        await this.setCached(cacheKey, result);
        return result;
    }

    async getApplications(period: Period) {
        const cacheKey = `analytics:applications:${period}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const since = periodToSince(period);
        const [totalCount, viewCount] = await Promise.all([
            this.prisma.application.count({ where: { appliedAt: { gte: since } } }),
            this.prisma.jobView.count({ where: { viewedAt: { gte: since } } }),
        ]);

        const result = {
            period,
            totalCount,
            conversionRate: viewCount > 0 ? Math.round((totalCount / viewCount) * 1000) / 10 : 0,
        };

        await this.setCached(cacheKey, result);
        return result;
    }
}
