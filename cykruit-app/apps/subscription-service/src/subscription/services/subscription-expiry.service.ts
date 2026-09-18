// apps/subscription-service/src/subscription/services/subscription-expiry.service.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '@cykruit/logger';
import { AuditService } from '@cykruit/audit';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PaymentRepository } from '../repositories/payment.repository';

@Injectable()
export class SubscriptionExpiryService {
    constructor(
        private readonly repo: SubscriptionRepository,
        private readonly payRepo: PaymentRepository,
        private readonly eventPublisher: EventPublisher,
        private readonly auditService: AuditService,
        private readonly logger: AppLogger,
    ) {}

    /** Runs every hour. Marks ACTIVE subscriptions as EXPIRED when expiresAt has passed.
     *  Runs hourly so DB status reflects reality within 1 hour vs 23 hours for midnight-only. */
    @Cron(CronExpression.EVERY_HOUR)
    async expireStaleSubscriptions(): Promise<void> {
        this.logger.log('Running subscription expiry check', 'SubscriptionExpiryService');

        // Process in batches of 200 to avoid loading thousands of rows into memory at once.
        let totalExpired = 0;
        let batch: Array<{ id: string; employerId: string; package: { name: string } }>;

        do {
            batch = await this.repo.findExpiredActive(200);
            if (!batch.length) break;

            const ids = batch.map((s) => s.id);
            const count = await this.repo.expireMany(ids);
            totalExpired += count;

            // Audit each expiry and publish event for notifications
            for (const sub of batch) {
                this.auditService.logAction({
                    actorId: null,
                    actorRole: 'SYSTEM',
                    action: 'subscriptions:expire',
                    module: 'SUBSCRIPTIONS',
                    targetType: 'EmployerSubscription',
                    targetId: sub.id,
                    newData: { status: 'EXPIRED', employerId: sub.employerId },
                    riskLevel: 'MEDIUM',
                    result: 'SUCCESS',
                });

                const ownerUserId = await this.repo.findOwnerUserIdForEmployer(sub.employerId);
                if (ownerUserId) {
                    this.eventPublisher.publish(
                        DomainEventType.SUBSCRIPTION_EXPIRED,
                        {
                            subscriptionId: sub.id,
                            employerId: sub.employerId,
                            employerUserId: ownerUserId,
                            packageName: sub.package.name,
                        },
                        'subscription-service',
                    ).catch((err: unknown) =>
                        this.logger.warn(`SUBSCRIPTION_EXPIRED publish failed: ${String(err)}`, 'SubscriptionExpiryService'),
                    );
                }
            }
        } while (batch.length === 200); // keep looping until a batch comes back less than full

        if (totalExpired > 0) {
            this.logger.log(`Expired ${totalExpired} subscription(s)`, 'SubscriptionExpiryService');
        }
    }

    /** Runs every 5 minutes. Marks CREATED PaymentOrders as EXPIRED when their 15-min TTL passes. */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async expireStaleOrders(): Promise<void> {
        const count = await this.payRepo.expireStaleOrders();
        if (count > 0) {
            this.logger.log(`Expired ${count} stale payment order(s)`, 'SubscriptionExpiryService');
        }
    }
}
