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
import { isSubscriptionEntitled } from './subscription.service';
import { EmployerLimitsService } from '@cykruit/subscription';
import { AuditService } from '@cykruit/audit';
import { CreateOrderDto, PreviewOrderDto, BillingCycleInput } from '../dto/payment.dto';

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

        // ── Razorpay order creation ─────────────────────────────────────────
        // The razorpay SDK rejects with a plain object (not an Error instance)
        // when the API returns a non-2xx response. Left unhandled, that object
        // falls through to GlobalExceptionFilter's generic catch branch, which
        // only reads `.message` off real Error instances — so it gets logged
        // as "Unexpected error: Unknown" with zero diagnostic value. Catch it
        // here explicitly so both the logs and the client response carry the
        // real reason (bad keys, amount below minimum, etc).
        let rzOrder: { id: string };
        try {
            if (totalPaise < 100) {
                // Razorpay requires a minimum order amount of ₹1 (100 paise).
                // A 100%-off coupon or misconfigured discount can drive this to 0.
                throw new BadRequestException(
                    'Order amount is too low to process after discount. Please contact support.',
                );
            }

            rzOrder = await this.razorpay.orders.create({
                amount: totalPaise,
                currency: 'INR',
                receipt: `sub_${employerId.slice(0, 8)}_${Date.now()}`,
                notes: {
                    employerId,
                    packageId: dto.packageId,
                    billingCycle: dto.billingCycle,
                },
            });
        } catch (err: unknown) {
            if (err instanceof BadRequestException) throw err;

            const rzError = err as { statusCode?: number; error?: { code?: string; description?: string } };
            this.logger.error(
                `Razorpay order creation failed: ${JSON.stringify(rzError?.error ?? rzError ?? err)}`,
                undefined,
                'PaymentService',
            );
            throw new BadRequestException(
                rzError?.error?.description || 'Payment gateway rejected the order. Please try again.',
            );
        }

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

    // ── Preview order (no order created) ─────────────────────────────────────

    async previewOrder(userId: string, dto: PreviewOrderDto) {
        const employerId = await this.subRepo.resolveEmployerIdFromUser(userId);
        if (!employerId) throw new ForbiddenException('Employer account required');

        const pkg = await this.subRepo.findPackageById(dto.packageId);
        if (!pkg) throw new NotFoundException('Package not found');
        if (!pkg.isActive) throw new BadRequestException('Package is not active');

        const basePrice = this.resolveBasePrice(pkg, dto.billingCycle);
        if (basePrice === null) {
            return {
                packageId: dto.packageId,
                packageName: pkg.name,
                billingCycle: dto.billingCycle,
                breakdown: {
                    baseAmountPaise: 0,
                    discountAmountPaise: 0,
                    gstAmountPaise: 0,
                    totalAmountPaise: 0,
                    gstPercent: 18,
                },
                isFree: true,
            };
        }

        const basePaise = Math.round(Number(basePrice) * 100);
        let discountAmountPaise = 0;
        let discountId: string | undefined;
        let couponCode: string | undefined;
        let discountName: string | undefined;

        if (dto.couponCode) {
            // validateCoupon throws descriptive errors — let them propagate to the client
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
            discountName = preview.name;
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
                discountName = autoPreview.name;
            }
        }

        const discountedBase = basePaise - discountAmountPaise;
        const gstPaise = Math.round(discountedBase * GST_RATE);
        const totalPaise = discountedBase + gstPaise;

        return {
            packageId: dto.packageId,
            packageName: pkg.name,
            billingCycle: dto.billingCycle,
            breakdown: {
                baseAmountPaise: basePaise,
                discountAmountPaise,
                gstAmountPaise: gstPaise,
                totalAmountPaise: totalPaise,
                gstPercent: 18,
            },
            ...(discountId && {
                discountApplied: { id: discountId, code: couponCode ?? null, name: discountName ?? '' },
            }),
            isFree: false,
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
        // Only skip if the employer is currently entitled to a plan — entitlement is
        // status + expiry based (isSubscriptionEntitled), NOT effectiveStatus, so a
        // cancel-at-period-end plan (displayed as CANCELLED) is never clobbered by
        // free-tier activation. An ACTIVE plan whose expiresAt already passed (but the
        // hourly sweep hasn't flipped it yet) is correctly treated as eligible.
        if (existing && isSubscriptionEntitled(existing.status, existing.expiresAt)) return;

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

        // Defense-in-depth: the amount/currency on the captured payment must match
        // the order we priced server-side. A mismatched (or forged) webhook payload
        // must never activate a subscription at a different price.
        const capturedAmount = Number(paymentEntity?.['amount']);
        const capturedCurrency = paymentEntity?.['currency'] as string | undefined;
        if (
            !Number.isFinite(capturedAmount) ||
            capturedAmount !== order.totalAmountPaise ||
            capturedCurrency !== order.currency
        ) {
            this.logger.warn(
                `payment.captured amount/currency mismatch — razorpayOrderId=${razorpayOrderId} ` +
                    `expected ${order.totalAmountPaise} ${order.currency}, got ${capturedAmount} ${capturedCurrency}. ` +
                    `Subscription NOT activated.`,
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
                    cancelAtPeriodEnd: false,
                    cancelRequestedAt: null,
                },
                update: {
                    packageId: order.packageId,
                    status: 'ACTIVE',
                    startedAt: new Date(),
                    expiresAt,
                    billingCycle: order.billingCycle as BillingCycle,
                    // A fresh payment always reactivates — clears any pending cancellation.
                    cancelAtPeriodEnd: false,
                    cancelRequestedAt: null,
                },
                select: { id: true },
            });

            // Sequential per-year invoice number (e.g. INV-2026-000123). The upsert's
            // increment runs as a single row-locked UPDATE, so concurrent captures
            // serialize on this row instead of racing on a read-then-write.
            const year = new Date().getUTCFullYear();
            const sequence = await tx.invoiceSequence.upsert({
                where: { year },
                create: { year, counter: 1 },
                update: { counter: { increment: 1 } },
                select: { counter: true },
            });
            const invoiceNumber = `INV-${year}-${String(sequence.counter).padStart(6, '0')}`;

            await tx.payment.create({
                data: {
                    orderId: order.id,
                    razorpayPaymentId,
                    razorpaySignature,
                    capturedAt: new Date(),
                    status: 'CAPTURED',
                    invoiceNumber,
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
        // Use UTC throughout so expiry is deterministic regardless of the
        // container's local timezone or DST.  The month-end clamping logic
        // stays the same (leap-year safe) — only the accessors change.
        const now = new Date();
        const targetYear =
            billingCycle === BillingCycle.YEARLY
                ? now.getUTCFullYear() + 1
                : now.getUTCFullYear();
        const targetMonth =
            billingCycle === BillingCycle.YEARLY
                ? now.getUTCMonth()
                : now.getUTCMonth() + 1;
        // Clamp day to the last valid day of the target month.
        // e.g. Jan 31 + 1 month → Feb 28/29, not Mar 2.
        const daysInTarget = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
        const clampedDay = Math.min(now.getUTCDate(), daysInTarget);
        return new Date(Date.UTC(
            targetYear, targetMonth, clampedDay,
            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds(),
        ));
    }
}