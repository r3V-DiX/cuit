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
import { AppLogger } from '@cykruit/logger';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PaymentRepository } from '../repositories/payment.repository';
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
        private readonly subRepo: SubscriptionRepository,
        private readonly payRepo: PaymentRepository,
        private readonly eventPublisher: EventPublisher,
        private readonly logger: AppLogger,
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

        const basePrice = this.resolveBasePrice(pkg, dto.billingCycle);
        if (basePrice === null) {
            throw new BadRequestException('This package is free — no payment required');
        }

        const basePaise = Math.round(Number(basePrice) * 100);
        const gstPaise = Math.round(basePaise * GST_RATE);
        const totalPaise = basePaise + gstPaise;

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
            gstAmountPaise: gstPaise,
            totalAmountPaise: totalPaise,
            expiresAt: new Date(Date.now() + ORDER_TTL_MS),
        });

        return {
            orderId: order.id,
            razorpayOrderId: rzOrder.id,
            amount: totalPaise,
            currency: 'INR',
            breakdown: {
                baseAmountPaise: basePaise,
                gstAmountPaise: gstPaise,
                totalAmountPaise: totalPaise,
                gstPercent: 18,
            },
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

    // ── Free-tier activation (called by event processor) ─────────────────────

    async activateFreeTierIfEligible(employerId: string): Promise<void> {
        const existing = await this.subRepo.findSubscriptionByEmployer(employerId);
        if (existing) return; // already has a subscription

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
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private verifyWebhookSignature(rawBody: Buffer, signature: string): void {
        const expected = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(rawBody)
            .digest('hex');

        if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
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
        const razorpaySignature = (paymentEntity?.['description'] as string) ?? '';

        if (!razorpayOrderId || !razorpayPaymentId) {
            this.logger.warn('payment.captured webhook missing order_id or payment id', 'PaymentService');
            return;
        }

        const order = await this.payRepo.findOrderByRazorpayId(razorpayOrderId);
        if (!order) {
            this.logger.warn(`No local order for razorpayOrderId=${razorpayOrderId}`, 'PaymentService');
            return;
        }

        if (order.status === 'PAID') return; // idempotent

        const pkg = await this.subRepo.findPackageById(order.packageId);
        if (!pkg) return;

        const expiresAt = this.computeExpiry(order.billingCycle as BillingCycle);

        const subscription = await this.subRepo.assignSubscription(
            order.employerId,
            order.packageId,
            expiresAt,
        );

        // Update billingCycle on the subscription
        await this.subRepo.updateBillingCycle(subscription.id, order.billingCycle as BillingCycle);

        await this.payRepo.createPayment({
            orderId: order.id,
            razorpayPaymentId,
            razorpaySignature,
            capturedAt: new Date(),
        });

        await this.payRepo.markOrderPaid(order.id, subscription.id);

        const ownerUserId = await this.subRepo.findOwnerUserIdForEmployer(order.employerId);
        if (ownerUserId) {
            this.eventPublisher.publish(
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
            );

            this.eventPublisher.publish(
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
        if (billingCycle === BillingCycle.MONTHLY) {
            now.setMonth(now.getMonth() + 1);
        } else {
            now.setFullYear(now.getFullYear() + 1);
        }
        return now;
    }
}
