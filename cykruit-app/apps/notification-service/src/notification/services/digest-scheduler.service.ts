// apps/notification-service/src/notification/services/digest-scheduler.service.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '@cykruit/logger';
import { NotificationService } from './notification.service';

@Injectable()
export class DigestSchedulerService {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly logger: AppLogger,
    ) {}

    /** Enqueue daily digest at 08:00 UTC every day. */
    @Cron(CronExpression.EVERY_DAY_AT_8AM, { timeZone: 'UTC' })
    async scheduleDailyDigest(): Promise<void> {
        this.logger.log('Enqueuing daily digest job', 'DigestSchedulerService');
        await this.notificationService.enqueueDailyDigest();
    }
}
