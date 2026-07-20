// apps/subscription-service/src/subscription/services/payment.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { BillingCycle } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';
import { AppLogger } from '@cykruit/logger';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { DiscountService } from './discount.service';
import { EmployerLimitsService } from '@cykruit/subscription';
import { AuditService } from '@cykruit/audit';
import { CreateOrderDto, BillingCycleInput } from '../dto/payment.dto';

const GST_RATE = 0.18;
/** Razorpay order validity — 15 minutes */
const ORDER_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class PaymentService {
    private readonly razorpay: Razorpay;
    private readonly webhookSecret: string;

    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
        private readonly subRepo: SubscriptionRepository,
        private readonly payRepo: PaymentRepository,
        private readonly discountService: DiscountService,
        private readonly eventPublisher: EventPublisher,
        private readonly logger: AppLogger,
        private readonly employerLimitsService: EmployerLimitsService,
        private readonly auditService: AuditService,
    ) {
        this.razorpay = new Razorpay({
            key_id: this.config.getOrThrow<string>('RAZORPAY_KEY_ID'),
            key_secret: this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET'),
        });
        this.webhookSecret = this.config.getOrThrow<string>('RAZORPAY_WEBHOOK_SECRET');
    }

    // ── Create order ──────────────────────────────────────────────────────────

    async createOrder(userId: string, dto: CreateOrderDto) {
        const employerId = await this.subRepo.resolveEmployerIdFromUser(userId);
        if (!employerId) throw new ForbiddenException('Employer account required');

        const pkg = await this.subRepo.findPackageById(dto.packageId);
        if (!pkg) throw new NotFoundException('Package not found');
        if (!pkg.isActive) throw new BadRequestException('Package is not active');

        // Idempotency guard — return existing live order if one already exists for this
        // employer+package+billingCycle to prevent double-charging on rapid retries.
        // Run inside a serializable transaction so concurrent requests can't both pass
        // the check and create duplicate orders simultaneously.
        const existingOrder = await this.prisma.$transaction(
            () => this.payRepo.findLiveOrder(employerId, dto.packageId, dto.billingCycle as BillingCycle),
            { isolationLevel: 'Serializable' },
        );
        if (existingOrder) {
            return {
                orderId: existingOrder.id,
                razorpayOrderId: existingOrder.razorpayOrderId,
                amount: existingOrder.totalAmountPaise,
                currency: existingOrder.currency,
                breakdown: {
                    baseAmountPaise: existingOrder.amountPaise,
                    discountAmountPaise: existingOrder.discountAmountPaise,
                    gstAmountPaise: existingOrder.gstAmountPaise,
                    totalAmountPaise: existingOrder.totalAmountPaise,
                    gstPercent: 18,
                },
                packageName: pkg.name,
                billingCycle: dto.billingCycle,
                keyId: this.config.getOrThrow<string>('RAZORPAY_KEY_ID'),
            };
        }

        const basePrice = this.resolveBasePrice(pkg, dto.billingCycle);
        if (basePrice === null) {
            throw new BadRequestException('This package is free — no payment required');
        }

        const basePaise = Math.round(Number(basePrice) * 100);

        // Resolve discount: coupon code takes priority over automatic
        let discountAmountPaise = 0;
        let discountId: string | undefined;
        let couponCode: string | undefined;

        if (dto.couponCode) {
            const preview = await this.discountService.validateCoupon(
                dto.couponCode,
                employerId,
                dto.packageId,
                dto.billingCycle as BillingCycle,
                basePaise,
            );
            discountAmountPaise = preview.discountAmountPaise;
            discountId = preview.discountId;
            couponCode = dto.couponCode.toUpperCase();
        } else {
            const autoPreview = await this.discountService.findApplicableAutoDiscount(
                employerId,
                dto.packageId,
                dto.billingCycle as BillingCycle,
                basePaise,
            );
            if (autoPreview) {
                discountAmountPaise = autoPreview.discountAmountPaise;
                discountId = autoPreview.discountId;
            }
        }

        const discountedBasePaise = basePaise - discountAmountPaise;
        const gstPaise = Math.round(discountedBasePaise * GST_RATE);
        const totalPaise = discountedBasePaise + gstPaise;

        const rzOrder = await this.razorpay.orders.create({
            amount: totalPaise,
            currency: 'INR',
            receipt: `sub_${employerId.slice(0, 8)}_${Date.now()}`,
            notes: {
                employerId,
                packageId: dto.packageId,
                billingCycle: dto.billingCycle,
            },
        });

        const order = await this.payRepo.createOrder({
            employerId,
            packageId: dto.packageId,
            razorpayOrderId: rzOrder.id,
            billingCycle: dto.billingCycle as BillingCycle,
            amountPaise: basePaise,
            discountAmountPaise,
            discountId,
            couponCode,
            gstAmountPaise: gstPaise,
            totalAmountPaise: totalPaise,
            expiresAt: new Date(Date.now() + ORDER_TTL_MS),
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'subscriptions:order_created',
            module: 'SUBSCRIPTIONS',
            targetType: 'PaymentOrder',
            targetId: order.id,
            newData: {
                packageId: dto.packageId,
                packageName: pkg.name,
                billingCycle: dto.billingCycle,
                totalAmountPaise: totalPaise,
                discountAmountPaise,
                razorpayOrderId: rzOrder.id,
            },
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return {
            orderId: order.id,
            razorpayOrderId: rzOrder.id,
            amount: totalPaise,
            currency: 'INR',
            breakdown: {
                baseAmountPaise: basePaise,
                discountAmountPaise,
                gstAmountPaise: gstPaise,
                totalAmountPaise: totalPaise,
                gstPercent: 18,
            },
            ...(discountId && { discountApplied: { id: discountId, code: couponCode ?? null } }),
            packageName: pkg.name,
            billingCycle: dto.billingCycle,
            keyId: this.config.getOrThrow<string>('RAZORPAY_KEY_ID'),
        };
    }

    // ── Webhook handler ───────────────────────────────────────────────────────

    async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
        this.verifyWebhookSignature(rawBody, signature);

        const event = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
        const eventType = event['event'] as string;

        if (eventType === 'payment.captured') {
            await this.handlePaymentCaptured(event);
        } else if (eventType === 'payment.failed') {
            await this.handlePaymentFailed(event);
        }
    }

    // ── Order history (employer-facing) ──────────────────────────────────────

    async getMyOrders(userId: string, page = 1, limit = 50) {
        const employerId = await this.subRepo.resolveEmployerIdFromUser(userId);
        if (!employerId) throw new ForbiddenException('Employer account required');
        return this.payRepo.findOrdersByEmployer(employerId, page, limit);
    }

    // ── Free-tier activation (called by event processor) ─────────────────────

    async activateFreeTierIfEligible(employerId: string): Promise<void> {
        const employer = await this.subRepo.findEmployerById(employerId);
        if (!employer) {
            this.logger.warn(
                `Employer ${employerId} not found — skipping free-tier activation`,
                'PaymentService',
            );
            return;
        }

        const existing = await this.subRepo.findSubscriptionByEmployer(employerId);
        // Only skip if there is an active subscription.
        // CANCELLED or EXPIRED employers should receive the free tier.
        if (existing && existing.status === 'ACTIVE') return;

        const freePkg = await this.payRepo.findFreePackage();
        if (!freePkg) {
            this.logger.warn(
                `No free package found for auto-activation. employerId=${employerId}`,
                'PaymentService',
            );
            return;
        }

        await this.subRepo.assignSubscription(employerId, freePkg.id, undefined);
        this.logger.log(
            `Free tier "${freePkg.name}" auto-activated for employer ${employerId}`,
            'PaymentService',
        );

        this.auditService.logAction({
            actorId: 'SYSTEM',
            actorRole: 'ADMIN',
            action: 'subscriptions:free_tier_activated',
            module: 'SUBSCRIPTIONS',
            targetType: 'EmployerSubscription',
            targetId: employerId,
            newData: { packageId: freePkg.id, packageName: freePkg.name, employerId },
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private verifyWebhookSignature(rawBody: Buffer, signature: string): void {
        const expected = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(rawBody)
            .digest('hex');

        const expectedBuf = Buffer.from(expected);
        const receivedBuf = Buffer.from(signature);

        // timingSafeEqual throws a RangeError when lengths differ — guard first.
        if (expectedBuf.length !== receivedBuf.length) {
            throw new UnprocessableEntityException('Invalid webhook signature');
        }
        if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
            throw new UnprocessableEntityException('Invalid webhook signature');
        }
    }

    private resolveBasePrice(
        pkg: { priceMonthly: unknown; priceYearly: unknown },
        billingCycle: BillingCycleInput,
    ): string | null {
        const raw = billingCycle === BillingCycleInput.MONTHLY
            ? pkg.priceMonthly
            : pkg.priceYearly;
        if (raw == null) return null;
        const n = Number(raw);
        if (n === 0) return null;
        return String(n);
    }

    private async handlePaymentCaptured(event: Record<string, unknown>): Promise<void> {
        const entity = (event['payload'] as Record<string, unknown>)?.['payment'] as Record<string, unknown>;
        const paymentEntity = entity?.['entity'] as Record<string, unknown>;

        const razorpayPaymentId = paymentEntity?.['id'] as string;
        const razorpayOrderId = paymentEntity?.['order_id'] as string;
        // Store HMAC(orderId|paymentId) as an audit proof token.
        // The real webhook signature was already verified by verifyWebhookSignature().
        const razorpaySignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (!razorpayOrderId || !razorpayPaymentId) {
            this.logger.warn('payment.captured webhook missing order_id or payment id', 'PaymentService');
            return;
        }

        const order = await this.payRepo.findOrderByRazorpayId(razorpayOrderId);
        if (!order) {
            this.logger.warn(`No local order for razorpayOrderId=${razorpayOrderId}`, 'PaymentService');
            return;
        }

        // Full idempotency: if payment row already exists for this razorpayPaymentId,
        // Razorpay fired the webhook twice — silently discard the duplicate.
        const existingPayment = await this.prisma.payment.findUnique({
            where: { razorpayPaymentId },
            select: { id: true },
        });
        if (existingPayment) return;

        if (order.status === 'PAID') return; // order already processed via a prior webhook

        // Reject captures for expired orders — Razorpay may send the event late
        if (order.status === 'EXPIRED' || (order.expiresAt && order.expiresAt <= new Date())) {
            this.logger.warn(
                `payment.captured received for expired order razorpayOrderId=${razorpayOrderId}`,
                'PaymentService',
            );
            return;
        }

        const pkg = await this.subRepo.findPackageById(order.packageId);
        if (!pkg) {
            this.logger.error(
                `Package ${order.packageId} not found during payment capture — subscription NOT activated. razorpayOrderId=${razorpayOrderId}`,
                'PaymentService',
            );
            return;
        }

        const expiresAt = this.computeExpiry(order.billingCycle as BillingCycle);

        // Atomic: all DB writes succeed or all roll back
        const { subscription } = await this.prisma.$transaction(async (tx) => {
            const sub = await tx.employerSubscription.upsert({
                where: { employerId: order.employerId },
                create: {
                    employerId: order.employerId,
                    packageId: order.packageId,
                    status: 'ACTIVE',
                    startedAt: new Date(),
                    expiresAt,
                    billingCycle: order.billingCycle as BillingCycle,
                },
                update: {
                    packageId: order.packageId,
                    status: 'ACTIVE',
                    startedAt: new Date(),
                    expiresAt,
                    billingCycle: order.billingCycle as BillingCycle,
                },
                select: { id: true },
            });

            await tx.payment.create({
                data: {
                    orderId: order.id,
                    razorpayPaymentId,
                    razorpaySignature,
                    capturedAt: new Date(),
                    status: 'CAPTURED',
                },
                select: { id: true },
            });

            await tx.paymentOrder.update({
                where: { id: order.id },
                data: { status: 'PAID', subscriptionId: sub.id },
                select: { id: true },
            });

            // Record discount usage inside the same transaction if a discount was applied
            if (order.discountId && order.discountAmountPaise > 0) {
                await this.discountService.applyDiscount(
                    tx,
                    order.discountId,
                    order.employerId,
                    order.id,
                    order.discountAmountPaise,
                );
            }

            return { subscription: sub };
        });

        // Invalidate cached limits so employer immediately gets new plan limits
        await this.employerLimitsService.invalidate(order.employerId).catch((err: unknown) =>
            this.logger.warn(`Failed to invalidate employer limits cache: ${String(err)}`, 'PaymentService'),
        );

        const ownerUserId = await this.subRepo.findOwnerUserIdForEmployer(order.employerId);

        this.auditService.logAction({
            actorId: ownerUserId ?? order.employerId,
            actorRole: 'EMPLOYER',
            action: 'subscriptions:payment_captured',
            module: 'SUBSCRIPTIONS',
            targetType: 'EmployerSubscription',
            targetId: subscription.id,
            newData: {
                packageId: order.packageId,
                packageName: pkg.name,
                billingCycle: order.billingCycle,
                totalAmountPaise: order.totalAmountPaise,
                razorpayPaymentId,
                expiresAt: expiresAt.toISOString(),
            },
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });
        if (ownerUserId) {
            await this.eventPublisher.publish(
                DomainEventType.SUBSCRIPTION_PAYMENT_CAPTURED,
                {
                    orderId: order.id,
                    paymentId: razorpayPaymentId,
                    employerId: order.employerId,
                    employerUserId: ownerUserId,
                    packageName: pkg.name,
                    billingCycle: order.billingCycle,
                    amountPaise: order.totalAmountPaise,
                },
                'subscription-service',
            ).catch((err: unknown) =>
                this.logger.warn(`SUBSCRIPTION_PAYMENT_CAPTURED publish failed: ${String(err)}`, 'PaymentService'),
            );

            await this.eventPublisher.publish(
                DomainEventType.SUBSCRIPTION_RENEWED,
                {
                    subscriptionId: subscription.id,
                    employerId: order.employerId,
                    employerUserId: ownerUserId,
                    packageName: pkg.name,
                    billingCycle: order.billingCycle,
                    expiresAt: expiresAt.toISOString(),
                },
                'subscription-service',
            ).catch((err: unknown) =>
                this.logger.warn(`SUBSCRIPTION_RENEWED publish failed: ${String(err)}`, 'PaymentService'),
            );
        }
    }

    private async handlePaymentFailed(event: Record<string, unknown>): Promise<void> {
        const entity = (event['payload'] as Record<string, unknown>)?.['payment'] as Record<string, unknown>;
        const paymentEntity = entity?.['entity'] as Record<string, unknown>;
        const razorpayOrderId = paymentEntity?.['order_id'] as string;

        if (!razorpayOrderId) return;
        await this.payRepo.markOrderFailed(razorpayOrderId);
    }

    private computeExpiry(billingCycle: BillingCycle): Date {
        const now = new Date();
        const targetYear  = billingCycle === BillingCycle.YEARLY ? now.getFullYear() + 1 : now.getFullYear();
        const targetMonth = billingCycle === BillingCycle.YEARLY ? now.getMonth()       : now.getMonth() + 1;
        // Clamp day to the last valid day of the target month.
        // e.g. Jan 31 + 1 month → Feb 28/29, not Mar 2.
        const daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
        const clampedDay   = Math.min(now.getDate(), daysInTarget);
        return new Date(
            targetYear, targetMonth, clampedDay,
            now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds(),
        );
    }
}
