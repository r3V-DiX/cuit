// apps/subscription-service/src/subscription/repositories/subscription.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { BillingCycle, Prisma } from '@prisma/client';
import { CreatePackageDto, UpdatePackageDto } from '../dto/package.dto';
import { PackageListQueryDto, SubscriptionListQueryDto } from '../dto/query.dto';

const PACKAGE_SELECT = {
    id: true,
    name: true,
    description: true,
    isActive: true,
    maxActiveJobs: true,
    maxTeamMembers: true,
    featuredJobSlots: true,
    aiScoringEnabled: true,
    priceMonthly: true,
    priceYearly: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.SubscriptionPackageSelect;

const SUBSCRIPTION_SELECT = {
    id: true,
    employerId: true,
    packageId: true,
    status: true,
    billingCycle: true,
    startedAt: true,
    expiresAt: true,
    currentActiveJobs: true,
    currentTeamMembers: true,
    usedFeaturedJobSlots: true,
    createdAt: true,
    updatedAt: true,
    package: {
        select: PACKAGE_SELECT,
    },
    employer: {
        select: {
            id: true,
            companyName: true,
            slug: true,
        },
    },
} satisfies Prisma.EmployerSubscriptionSelect;

@Injectable()
export class SubscriptionRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ── Packages ──────────────────────────────────────────────────────────────

    async findAllPackages(query: PackageListQueryDto) {
        const { page = 1, limit = 20, isActive } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.SubscriptionPackageWhereInput = {
            ...(isActive !== undefined ? { isActive } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.subscriptionPackage.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' },
                select: PACKAGE_SELECT,
            }),
            this.prisma.subscriptionPackage.count({ where }),
        ]);

        return { items, total };
    }

    async findPackageById(id: string) {
        return this.prisma.subscriptionPackage.findUnique({
            where: { id },
            select: PACKAGE_SELECT,
        });
    }

    async findPackageByName(name: string) {
        return this.prisma.subscriptionPackage.findUnique({
            where: { name },
            select: { id: true },
        });
    }

    async createPackage(dto: CreatePackageDto) {
        return this.prisma.subscriptionPackage.create({
            data: {
                name: dto.name,
                description: dto.description,
                isActive: dto.isActive ?? true,
                maxActiveJobs: dto.maxActiveJobs ?? 5,
                maxTeamMembers: dto.maxTeamMembers ?? 3,
                featuredJobSlots: dto.featuredJobSlots ?? 0,
                aiScoringEnabled: dto.aiScoringEnabled ?? false,
                priceMonthly: dto.priceMonthly ? new Prisma.Decimal(dto.priceMonthly) : null,
                priceYearly: dto.priceYearly ? new Prisma.Decimal(dto.priceYearly) : null,
            },
            select: PACKAGE_SELECT,
        });
    }

    async updatePackage(id: string, dto: UpdatePackageDto) {
        return this.prisma.subscriptionPackage.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
                ...(dto.maxActiveJobs !== undefined ? { maxActiveJobs: dto.maxActiveJobs } : {}),
                ...(dto.maxTeamMembers !== undefined ? { maxTeamMembers: dto.maxTeamMembers } : {}),
                ...(dto.featuredJobSlots !== undefined ? { featuredJobSlots: dto.featuredJobSlots } : {}),
                ...(dto.aiScoringEnabled !== undefined ? { aiScoringEnabled: dto.aiScoringEnabled } : {}),
                ...(dto.priceMonthly !== undefined
                    ? { priceMonthly: dto.priceMonthly ? new Prisma.Decimal(dto.priceMonthly) : null }
                    : {}),
                ...(dto.priceYearly !== undefined
                    ? { priceYearly: dto.priceYearly ? new Prisma.Decimal(dto.priceYearly) : null }
                    : {}),
            },
            select: PACKAGE_SELECT,
        });
    }

    async deletePackage(id: string) {
        await this.prisma.subscriptionPackage.delete({ where: { id } });
    }

    async countSubscriptionsForPackage(packageId: string): Promise<number> {
        return this.prisma.employerSubscription.count({
            where: { packageId, status: 'ACTIVE' },
        });
    }

    // ── Employer subscriptions ────────────────────────────────────────────────

    async findAllSubscriptions(query: SubscriptionListQueryDto) {
        const { page = 1, limit = 20, status, packageId } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.EmployerSubscriptionWhereInput = {
            ...(status ? { status } : {}),
            ...(packageId ? { packageId } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.employerSubscription.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: SUBSCRIPTION_SELECT,
            }),
            this.prisma.employerSubscription.count({ where }),
        ]);

        return { items, total };
    }

    async findSubscriptionByEmployer(employerId: string) {
        return this.prisma.employerSubscription.findUnique({
            where: { employerId },
            select: SUBSCRIPTION_SELECT,
        });
    }

    async findSubscriptionById(id: string) {
        return this.prisma.employerSubscription.findUnique({
            where: { id },
            select: SUBSCRIPTION_SELECT,
        });
    }

    /** Upsert subscription — assign or reassign package to employer. */
    async assignSubscription(employerId: string, packageId: string, expiresAt?: Date) {
        return this.prisma.employerSubscription.upsert({
            where: { employerId },
            create: {
                employerId,
                packageId,
                status: 'ACTIVE',
                startedAt: new Date(),
                expiresAt: expiresAt ?? null,
            },
            update: {
                packageId,
                status: 'ACTIVE',
                startedAt: new Date(),
                expiresAt: expiresAt ?? null,
                // Do NOT reset usage counters here — live counts come from refreshUsage().
                // Resetting would cause the limit check in employer-service to show wrong headroom.
            },
            select: SUBSCRIPTION_SELECT,
        });
    }

    async updateSubscriptionStatus(id: string, status: string) {
        return this.prisma.employerSubscription.update({
            where: { id },
            data: { status },
            select: SUBSCRIPTION_SELECT,
        });
    }

    async updateBillingCycle(id: string, billingCycle: BillingCycle) {
        return this.prisma.employerSubscription.update({
            where: { id },
            data: { billingCycle },
            select: { id: true, billingCycle: true },
        });
    }

    async findEmployerById(id: string) {
        return this.prisma.employer.findUnique({ where: { id }, select: { id: true } });
    }

    /** Resolve employerId from userId via EmployerMember. Returns null if user is not an employer. */
    async resolveEmployerIdFromUser(userId: string): Promise<string | null> {
        const member = await this.prisma.employerMember.findFirst({
            where: { userId },
            select: { employerId: true },
        });
        return member?.employerId ?? null;
    }

    /** Find ACTIVE subscriptions whose expiresAt has passed — for expiry cron.
     *  @param batchSize Cap results per call; caller loops until empty to process all. */
    async findExpiredActive(batchSize = 200): Promise<Array<{ id: string; employerId: string; package: { name: string } }>> {
        return this.prisma.employerSubscription.findMany({
            where: {
                status: 'ACTIVE',
                expiresAt: { lt: new Date() },
            },
            take: batchSize,
            orderBy: { expiresAt: 'asc' },
            select: {
                id: true,
                employerId: true,
                package: { select: { name: true } },
            },
        });
    }

    /** Bulk flip status to EXPIRED by ID. */
    async expireMany(ids: string[]): Promise<number> {
        const result = await this.prisma.employerSubscription.updateMany({
            where: { id: { in: ids } },
            data: { status: 'EXPIRED' },
        });
        return result.count;
    }

    /** Get owner userId for an employer. */
    async findOwnerUserIdForEmployer(employerId: string): Promise<string | null> {
        const member = await this.prisma.employerMember.findFirst({
            where: { employerId, role: 'OWNER' },
            select: { userId: true },
        });
        return member?.userId ?? null;
    }

    /** Sync real-time usage from live DB counts. */
    async refreshUsage(employerId: string) {
        const [activeJobs, teamMembers] = await this.prisma.$transaction([
            this.prisma.job.count({
                where: {
                    employerId,
                    status: { in: ['APPROVED', 'PENDING'] },
                },
            }),
            this.prisma.employerMember.count({
                where: { employerId },
            }),
        ]);

        return this.prisma.employerSubscription.update({
            where: { employerId },
            data: {
                currentActiveJobs: activeJobs,
                currentTeamMembers: teamMembers,
            },
            select: SUBSCRIPTION_SELECT,
        });
    }
}
