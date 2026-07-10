// admin-app/src/admin/repositories/subscription.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { CreatePackageDto, UpdatePackageDto, SubscriptionListQueryDto } from '../dto/subscription.dto';
// EmployerSubscription.status is a plain String field — no enum

@Injectable()
export class SubscriptionRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ── Packages ──────────────────────────────────────────────────────────────

    async findAllPackages(query: { isActive?: boolean } = {}) {
        return this.prisma.subscriptionPackage.findMany({
            where: query.isActive !== undefined ? { isActive: query.isActive } : undefined,
            orderBy: { priceMonthly: 'asc' },
        });
    }

    async findPackageById(id: string) {
        return this.prisma.subscriptionPackage.findUnique({ where: { id } });
    }

    async createPackage(dto: CreatePackageDto) {
        return this.prisma.subscriptionPackage.create({ data: dto });
    }

    async updatePackage(id: string, dto: UpdatePackageDto) {
        return this.prisma.subscriptionPackage.update({ where: { id }, data: dto });
    }

    async deletePackage(id: string) {
        return this.prisma.subscriptionPackage.delete({ where: { id } });
    }

    // ── Employer subscriptions ────────────────────────────────────────────────

    async findAllSubscriptions(query: SubscriptionListQueryDto): Promise<{ items: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 20, status, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.EmployerSubscriptionWhereInput = {
            ...(status ? { status } : {}),
            ...(q
                ? {
                      employer: {
                          companyName: { contains: q, mode: Prisma.QueryMode.insensitive },
                      },
                  }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.employerSubscription.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    employer: {
                        select: { id: true, companyName: true, slug: true, companyLogo: true },
                    },
                    package: true,
                },
            }),
            this.prisma.employerSubscription.count({ where }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findSubscriptionById(id: string) {
        return this.prisma.employerSubscription.findUnique({
            where: { id },
            include: { employer: { select: { id: true, companyName: true, slug: true, companyLogo: true } }, package: true },
        });
    }

    async assignSubscription(employerId: string, packageId: string, status: string) {
        return this.prisma.employerSubscription.upsert({
            where: { employerId },
            create: {
                employerId,
                packageId,
                status,
                currentActiveJobs: 0,
                currentTeamMembers: 0,
                usedFeaturedJobSlots: 0,
            },
            update: { packageId, status },
            include: { package: true },
        });
    }

    async findSubscriptionByEmployer(employerId: string) {
        return this.prisma.employerSubscription.findUnique({
            where: { employerId },
            include: { package: true },
        });
    }

    async updateSubscriptionStatus(id: string, status: string) {
        return this.prisma.employerSubscription.update({
            where: { id },
            data: { status },
            include: { package: true },
        });
    }
}
