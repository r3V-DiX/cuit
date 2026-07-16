// apps/notification-service/src/notification/notification.module.ts

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

import { PrismaModule } from '@cykruit/prisma';
import { CommonModule } from '@cykruit/common';
import { MailModule } from '@cykruit/mail';
import { RateLimitModule } from '@cykruit/rate-limit';
import { AuthCoreModule, SharedSessionValidator } from '@cykruit/auth-core';

import { EventsModule } from '@cykruit/events';

import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { WsTokenService } from './services/ws-token.service';
import { DigestSchedulerService } from './services/digest-scheduler.service';
import { NotificationRepository } from './repositories/notification.repository';
import { EmailDigestProcessor } from './processors/email-digest.processor';
import { DomainEventProcessor } from './processors/domain-event.processor';
import { NOTIFICATION_QUEUE } from './constants';
export { NOTIFICATION_QUEUE };

// Session validation moved to SharedSessionValidator (@cykruit/auth-core) —
// see docs/SESSION_MEMORY.md.

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        CommonModule,
        MailModule,
        RateLimitModule,
        ScheduleModule.forRoot(),
        EventsModule.forConsumer(),
        BullModule.registerQueue({
            name: NOTIFICATION_QUEUE,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: true,
                removeOnFail: false,
            },
        }),
        AuthCoreModule.forRoot({
            sessionValidatorClass: SharedSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: true,
        }),
    ],
    controllers: [NotificationController],
    providers: [
        NotificationService,
        WsTokenService,
        DigestSchedulerService,
        NotificationRepository,
        EmailDigestProcessor,
        DomainEventProcessor,
    ],
    exports: [NotificationService],
})
export class NotificationModule {}
