// apps/subscription-service/src/subscription/services/subscription-expiry.service.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '@cykruit/logger';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class SubscriptionExpiryService {
    constructor(
        private readonly repo: SubscriptionRepository,
        private readonly eventPublisher: EventPublisher,
        private readonly logger: AppLogger,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async expireStaleSubscriptions(): Promise<void> {
        this.logger.log('Running subscription expiry check', 'SubscriptionExpiryService');

        const expired = await this.repo.findExpiredActive();
        if (!expired.length) return;

        const ids = expired.map((s) => s.id);
        const count = await this.repo.expireMany(ids);

        this.logger.log(`Expired ${count} subscriptions`, 'SubscriptionExpiryService');

        // Publish SUBSCRIPTION_EXPIRED for each — notifications land via event bus
        for (const sub of expired) {
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
                );
            }
        }
    }
}
