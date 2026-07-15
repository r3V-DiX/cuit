// apps/subscription-service/src/subscription/repositories/payment.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { BillingCycle, PaymentOrderStatus, PaymentStatus, Prisma } from '@prisma/client';

const ORDER_SELECT = {
    id: true,
    employerId: true,
    subscriptionId: true,
    packageId: true,
    razorpayOrderId: true,
    billingCycle: true,
    amountPaise: true,
    discountAmountPaise: true,
    discountId: true,
    couponCode: true,
    gstAmountPaise: true,
    totalAmountPaise: true,
    currency: true,
    status: true,
    expiresAt: true,
    createdAt: true,
    package: { select: { id: true, name: true, priceMonthly: true, priceYearly: true } },
} satisfies Prisma.PaymentOrderSelect;

@Injectable()
export class PaymentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createOrder(data: {
        employerId: string;
        packageId: string;
        razorpayOrderId: string;
        billingCycle: BillingCycle;
        amountPaise: number;
        discountAmountPaise: number;
        discountId?: string;
        couponCode?: string;
        gstAmountPaise: number;
        totalAmountPaise: number;
        expiresAt: Date;
    }) {
        return this.prisma.paymentOrder.create({
            data: {
                ...data,
                status: PaymentOrderStatus.CREATED,
                currency: 'INR',
            },
            select: ORDER_SELECT,
        });
    }

    async findOrderByRazorpayId(razorpayOrderId: string) {
        return this.prisma.paymentOrder.findUnique({
            where: { razorpayOrderId },
            select: {
                ...ORDER_SELECT,
                employerId: true,
                billingCycle: true,
                totalAmountPaise: true,
                amountPaise: true,
                gstAmountPaise: true,
            },
        });
    }

    async findOrderById(id: string) {
        return this.prisma.paymentOrder.findUnique({
            where: { id },
            select: ORDER_SELECT,
        });
    }

    async markOrderPaid(orderId: string, subscriptionId: string) {
        return this.prisma.paymentOrder.update({
            where: { id: orderId },
            data: { status: PaymentOrderStatus.PAID, subscriptionId },
            select: { id: true, status: true },
        });
    }

    async markOrderFailed(razorpayOrderId: string) {
        return this.prisma.paymentOrder.updateMany({
            where: { razorpayOrderId, status: PaymentOrderStatus.CREATED },
            data: { status: PaymentOrderStatus.FAILED },
        });
    }

    async createPayment(data: {
        orderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
        capturedAt: Date;
    }) {
        return this.prisma.payment.create({
            data: {
                ...data,
                status: PaymentStatus.CAPTURED,
            },
            select: { id: true, razorpayPaymentId: true, status: true },
        });
    }

    async findFreePackage() {
        return this.prisma.subscriptionPackage.findFirst({
            where: {
                isActive: true,
                priceMonthly: null,
                priceYearly: null,
            },
            select: {
                id: true,
                name: true,
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
        });
    }

    /** Return an existing non-expired CREATED order for the same employer+package+cycle (idempotency). */
    async findLiveOrder(employerId: string, packageId: string, billingCycle: BillingCycle) {
        return this.prisma.paymentOrder.findFirst({
            where: {
                employerId,
                packageId,
                billingCycle,
                status: PaymentOrderStatus.CREATED,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                razorpayOrderId: true,
                amountPaise: true,
                discountAmountPaise: true,
                gstAmountPaise: true,
                totalAmountPaise: true,
                currency: true,
            },
        });
    }

    async findOrdersByEmployer(employerId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const safeLimit = Math.min(limit, 100);
        return this.prisma.paymentOrder.findMany({
            where: { employerId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: safeLimit,
            select: {
                id: true,
                razorpayOrderId: true,
                billingCycle: true,
                amountPaise: true,
                gstAmountPaise: true,
                totalAmountPaise: true,
                currency: true,
                status: true,
                expiresAt: true,
                createdAt: true,
                package: { select: { id: true, name: true } },
                payment: { select: { razorpayPaymentId: true, capturedAt: true } },
            },
        });
    }

    async expireStaleOrders(): Promise<number> {
        const result = await this.prisma.paymentOrder.updateMany({
            where: {
                status: PaymentOrderStatus.CREATED,
                expiresAt: { lt: new Date() },
            },
            data: { status: PaymentOrderStatus.EXPIRED },
        });
        return result.count;
    }
}
