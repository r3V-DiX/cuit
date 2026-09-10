// admin-app/src/admin/repositories/subscription.repository.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { ACTIONS, Searchable, type ISearchEntity, type SearchResultItem } from '../../common';
import { CreatePackageDto, UpdatePackageDto, SubscriptionListQueryDto } from './dto/subscription.dto';
// EmployerSubscription.status is a plain String field — no enum

@Searchable()
@Injectable()
export class SubscriptionRepository implements ISearchEntity {
    readonly key = 'subscriptions';
    readonly label = 'Subscriptions';
    readonly action = ACTIONS.SUBSCRIPTIONS.VIEW;

    constructor(private readonly prisma: PrismaService) {}

    async search(q: string, take: number): Promise<SearchResultItem[]> {
        const rows = await this.prisma.employerSubscription.findMany({
            where: { employer: { companyName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            select: { id: true, status: true, employer: { select: { companyName: true } } },
            take,
        });
        return rows.map((s) => ({
            id: s.id,
            title: s.employer.companyName,
            subtitle: s.status,
            href: `/subscriptions/${s.id}`,
        }));
    }

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
                cancelAtPeriodEnd: false,
                cancelRequestedAt: null,
            },
            update: {
                packageId,
                status,
                // Assigning always clears a pending cancel-at-period-end
                cancelAtPeriodEnd: false,
                cancelRequestedAt: null,
            },
            include: { package: true },
        });
    }

    async findEmployerIdsByPackage(packageId: string): Promise<string[]> {
        const rows = await this.prisma.employerSubscription.findMany({
            where: { packageId, status: 'ACTIVE' },
            select: { employerId: true },
        });
        return rows.map((r) => r.employerId);
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

    async refundPayment(orderId: string, paymentId: string, data: { razorpayRefundId: string; reason?: string }) {
        return this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'REFUNDED',
                    razorpayRefundId: data.razorpayRefundId,
                    refundedAt: new Date(),
                    refundReason: data.reason,
                },
            }),
            this.prisma.paymentOrder.update({
                where: { id: orderId },
                data: { status: 'REFUNDED' },
            }),
        ]);
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

    async updateSubscriptionStatus(id: string, status: string, cancelAtPeriodEnd?: boolean) {
        const existing = await this.prisma.employerSubscription.findUnique({
            where: { id },
            select: { id: true, status: true, cancelAtPeriodEnd: true },
        });
        if (!existing) throw new NotFoundException('Subscription not found');

        // Admin "cancel at period end" (polite, mirrors the employer self-cancel): keep
        // status ACTIVE so paid access continues until expiry, record the request.
        if (cancelAtPeriodEnd === true) {
            if (existing.cancelAtPeriodEnd) {
                throw new BadRequestException('Subscription is already cancelled (at period end)');
            }
            return this.prisma.employerSubscription.update({
                where: { id },
                data: { status: 'ACTIVE', cancelAtPeriodEnd: true, cancelRequestedAt: new Date() },
                include: { package: true },
            });
        }

        // Admin status override is authoritative (distinct from the polite at-period-end):
        // - CANCELLED = HARD cancel — status is no longer ACTIVE so entitlement is off
        //   immediately (Free-tier limits apply at once). No grace period.
        // - EXPIRED   = immediate revoke with time-based semantics.
        // - ACTIVE    = reactivate; clears a pending cancel-at-period-end flag.
        // Re-activating an already-ACTIVE plan is blocked to prevent quota-reset abuse,
        // but resuming from a cancel-at-period-end state IS allowed.
        if (existing.status === 'ACTIVE' && !existing.cancelAtPeriodEnd && status === 'ACTIVE') {
            throw new BadRequestException('Subscription is already ACTIVE');
        }

        return this.prisma.employerSubscription.update({
            where: { id },
            data: { status, cancelAtPeriodEnd: false, cancelRequestedAt: null },
            include: { package: true },
        });
    }
}
