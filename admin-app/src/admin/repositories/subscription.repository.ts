// admin-app/src/admin/repositories/subscription.repository.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

    async findPaymentOrders(query: { employerId?: string; page?: number; limit?: number }) {
        const { employerId, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        const where = employerId ? { employerId } : {};
        const [items, total] = await this.prisma.$transaction([
            this.prisma.paymentOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    employer: { select: { id: true, companyName: true, slug: true } },
                    package: { select: { id: true, name: true } },
                    payment: { select: { razorpayPaymentId: true, capturedAt: true, status: true } },
                },
            }),
            this.prisma.paymentOrder.count({ where }),
        ]);
        return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async findPaymentOrderById(id: string) {
        return this.prisma.paymentOrder.findUnique({
            where: { id },
            include: {
                employer: { select: { id: true, companyName: true, slug: true } },
                package: { select: { id: true, name: true } },
                payment: true,
            },
        });
    }

    async refreshEmployerUsage(employerId: string) {
        const [activeJobs, teamMembers] = await this.prisma.$transaction([
            this.prisma.job.count({ where: { employerId, status: { in: ['APPROVED', 'PENDING'] } } }),
            this.prisma.employerMember.count({ where: { employerId } }),
        ]);
        return this.prisma.employerSubscription.update({
            where: { employerId },
            data: { currentActiveJobs: activeJobs, currentTeamMembers: teamMembers },
            include: { package: true },
        });
    }

    async updateSubscriptionStatus(id: string, status: string) {
        const existing = await this.prisma.employerSubscription.findUnique({
            where: { id },
            select: { id: true, status: true },
        });
        if (!existing) throw new NotFoundException('Subscription not found');

        // Prevent re-activating an already-ACTIVE subscription to avoid quota reset abuse
        if (existing.status === 'ACTIVE' && status === 'ACTIVE') {
            throw new BadRequestException('Subscription is already ACTIVE');
        }

        return this.prisma.employerSubscription.update({
            where: { id },
            data: { status },
            include: { package: true },
        });
    }
}
