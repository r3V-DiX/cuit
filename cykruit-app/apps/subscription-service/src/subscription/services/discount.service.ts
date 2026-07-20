// apps/subscription-service/src/subscription/services/discount.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
    BillingCycle,
    DiscountApplicability,
    DiscountStatus,
    DiscountTrigger,
    DiscountType,
    Prisma,
} from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';

export interface DiscountPreview {
    discountId: string;
    code: string | null;
    name: string;
    discountAmountPaise: number;
    discountedBasePaise: number;
    gstPaise: number;
    totalPaise: number;
}

interface AutoConditions {
    firstOrderOnly?: boolean;
    minTeamSize?: number;
    billingCycle?: 'MONTHLY' | 'YEARLY';
}

const GST_RATE = 0.18;

const ACTIVE_DISCOUNT_SELECT = {
    id: true,
    name: true,
    code: true,
    trigger: true,
    discountType: true,
    value: true,
    maxDiscountCap: true,
    minOrderAmountPaise: true,
    applicability: true,
    billingCycles: true,
    maxTotalUses: true,
    maxUsesPerUser: true,
    status: true,
    startsAt: true,
    expiresAt: true,
    conditions: true,
    packages: { select: { packageId: true } },
    _count: { select: { usages: true } },
} satisfies Prisma.DiscountSelect;

@Injectable()
export class DiscountService {
    constructor(private readonly prisma: PrismaService) {}

    // ── Coupon code validation ────────────────────────────────────────────────

    async validateCoupon(
        code: string,
        employerId: string,
        packageId: string,
        billingCycle: BillingCycle,
        baseAmountPaise: number,
    ): Promise<DiscountPreview> {
        const discount = await this.prisma.discount.findUnique({
            where: { code },
            select: ACTIVE_DISCOUNT_SELECT,
        });

        if (!discount) throw new NotFoundException('Coupon code not found');
        if (discount.trigger !== DiscountTrigger.COUPON_CODE) {
            throw new BadRequestException('Invalid coupon code');
        }

        this.assertEligible(discount, employerId, packageId, billingCycle, baseAmountPaise, discount._count.usages);

        const perUserCount = await this.prisma.discountUsage.count({
            where: { discountId: discount.id, employerId },
        });
        if (perUserCount >= discount.maxUsesPerUser) {
            throw new BadRequestException('You have already used this coupon the maximum number of times');
        }

        return this.buildPreview(discount, baseAmountPaise);
    }

    // ── Automatic discount resolution ────────────────────────────────────────

    async findApplicableAutoDiscount(
        employerId: string,
        packageId: string,
        billingCycle: BillingCycle,
        baseAmountPaise: number,
    ): Promise<DiscountPreview | null> {
        const now = new Date();
        const candidates = await this.prisma.discount.findMany({
            where: {
                trigger: DiscountTrigger.AUTOMATIC,
                status: DiscountStatus.ACTIVE,
                startsAt: { lte: now },
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            select: ACTIVE_DISCOUNT_SELECT,
            orderBy: { value: 'desc' }, // highest value first
        });

        for (const discount of candidates) {
            // assertEligible throws for globally-ineligible discounts — skip those.
            try {
                this.assertEligible(discount, employerId, packageId, billingCycle, baseAmountPaise, discount._count.usages);
            } catch {
                continue;
            }

            const perUserCount = await this.prisma.discountUsage.count({
                where: { discountId: discount.id, employerId },
            });
            if (perUserCount >= discount.maxUsesPerUser) continue;

            if (!await this.evaluateConditions(discount.conditions, employerId, billingCycle)) continue;

            return this.buildPreview(discount, baseAmountPaise);
        }

        return null;
    }

    // ── Apply discount (call inside $transaction from payment.service.ts) ────

    async applyDiscount(
        tx: Prisma.TransactionClient,
        discountId: string,
        employerId: string,
        orderId: string,
        amountSavedPaise: number,
    ): Promise<void> {
        // Re-check per-user limit inside the transaction to prevent race condition
        // where two concurrent checkouts both passed validateCoupon with count=0.
        const discount = await tx.discount.findUnique({
            where: { id: discountId },
            select: { maxUsesPerUser: true },
        });
        if (discount) {
            const currentCount = await tx.discountUsage.count({
                where: { discountId, employerId },
            });
            if (currentCount >= discount.maxUsesPerUser) {
                throw new BadRequestException('Coupon usage limit reached — coupon already applied by your account');
            }
        }

        await tx.discountUsage.create({
            data: { discountId, employerId, orderId, amountSavedPaise },
            select: { id: true },
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private assertEligible(
        discount: {
            status: DiscountStatus;
            startsAt: Date;
            expiresAt: Date | null;
            applicability: DiscountApplicability;
            billingCycles: BillingCycle[];
            minOrderAmountPaise: number | null;
            maxTotalUses: number | null;
            packages: { packageId: string }[];
            _count: { usages: number };
        },
        _employerId: string,
        packageId: string,
        billingCycle: BillingCycle,
        baseAmountPaise: number,
        totalUsages: number,
    ): void {
        const now = new Date();

        if (discount.status !== DiscountStatus.ACTIVE) {
            throw new BadRequestException('Discount is not active');
        }
        if (discount.startsAt > now) {
            throw new BadRequestException('Discount has not started yet');
        }
        if (discount.expiresAt && discount.expiresAt <= now) {
            throw new BadRequestException('Discount has expired');
        }
        if (discount.maxTotalUses !== null && totalUsages >= discount.maxTotalUses) {
            throw new BadRequestException('Discount usage limit reached');
        }
        if (discount.billingCycles.length > 0 && !discount.billingCycles.includes(billingCycle)) {
            throw new BadRequestException('Discount not valid for this billing cycle');
        }
        if (discount.minOrderAmountPaise !== null && baseAmountPaise < discount.minOrderAmountPaise) {
            throw new BadRequestException(
                `Minimum order amount not met for this discount`,
            );
        }
        if (
            discount.applicability === DiscountApplicability.SPECIFIC_PACKAGES &&
            !discount.packages.some((p) => p.packageId === packageId)
        ) {
            throw new BadRequestException('Discount not valid for this package');
        }
    }

    private buildPreview(
        discount: {
            id: string;
            name: string;
            code: string | null;
            discountType: DiscountType;
            value: Prisma.Decimal;
            maxDiscountCap: number | null;
        },
        baseAmountPaise: number,
    ): DiscountPreview {
        const discountAmountPaise = this.calculateDiscountAmount(discount, baseAmountPaise);
        const discountedBasePaise = baseAmountPaise - discountAmountPaise;
        const gstPaise = Math.round(discountedBasePaise * GST_RATE);
        const totalPaise = discountedBasePaise + gstPaise;

        return {
            discountId: discount.id,
            code: discount.code,
            name: discount.name,
            discountAmountPaise,
            discountedBasePaise,
            gstPaise,
            totalPaise,
        };
    }

    calculateDiscountAmount(
        discount: {
            discountType: DiscountType;
            value: Prisma.Decimal;
            maxDiscountCap: number | null;
        },
        baseAmountPaise: number,
    ): number {
        const numericValue = Number(discount.value);

        if (discount.discountType === DiscountType.PERCENTAGE) {
            const raw = Math.floor(baseAmountPaise * (numericValue / 100));
            const capped = discount.maxDiscountCap !== null
                ? Math.min(raw, discount.maxDiscountCap)
                : raw;
            return capped;
        }

        // FLAT — value stored as INR rupees, convert to paise
        const flatPaise = Math.round(numericValue * 100);
        return Math.min(flatPaise, baseAmountPaise);
    }

    private async evaluateConditions(
        rawConditions: Prisma.JsonValue,
        employerId: string,
        billingCycle: BillingCycle,
    ): Promise<boolean> {
        if (!rawConditions || typeof rawConditions !== 'object' || Array.isArray(rawConditions)) {
            return true;
        }

        const conditions = rawConditions as AutoConditions;

        if (conditions.billingCycle && conditions.billingCycle !== billingCycle) {
            return false;
        }

        if (conditions.firstOrderOnly) {
            const priorPaidOrder = await this.prisma.paymentOrder.findFirst({
                where: { employerId, status: 'PAID' },
                select: { id: true },
            });
            if (priorPaidOrder) return false;
        }

        if (conditions.minTeamSize !== undefined) {
            const memberCount = await this.prisma.employerMember.count({
                where: { employerId },
            });
            if (memberCount < conditions.minTeamSize) return false;
        }

        return true;
    }
}
