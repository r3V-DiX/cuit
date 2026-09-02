// apps/subscription-service/src/subscription/subscription.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';

import { PrismaModule } from '@cykruit/prisma';
import { CommonModule } from '@cykruit/common';
import { SubscriptionModule as EmployerLimitsModule } from '@cykruit/subscription';
import { RateLimitModule } from '@cykruit/rate-limit';
import { LoggerModule } from '@cykruit/logger';
import { EventsModule, EMPLOYER_LIFECYCLE_QUEUE } from '@cykruit/events';
import { AuditModule } from '@cykruit/audit';
import { PermissionsModule } from '@cykruit/permissions';
import { AuthCoreModule, SharedSessionValidator } from '@cykruit/auth-core';

import { SubscriptionRepository } from './repositories/subscription.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { PackagesService } from './services/packages.service';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionExpiryService } from './services/subscription-expiry.service';
import { PaymentService } from './services/payment.service';
import { DiscountService } from './services/discount.service';
import { EmployerEventsProcessor } from './processors/employer-events.processor';
import { PublicPackagesController } from './controllers/packages.controller';
import { EmployerSubscriptionController } from './controllers/subscription.controller';
import { PaymentController } from './controllers/payment.controller';

// Session validation moved to SharedSessionValidator (@cykruit/auth-core) —
// see docs/SESSION_MEMORY.md.

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        CommonModule,
        EmployerLimitsModule,
        RateLimitModule,
        LoggerModule,
        AuditModule,
        PermissionsModule,
        ScheduleModule.forRoot(),
        EventsModule.forPublisher(),
        EventsModule.forConsumer(EMPLOYER_LIFECYCLE_QUEUE),
        AuthCoreModule.forRoot({
            sessionValidatorClass: SharedSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: true,
        }),
    ],
    controllers: [
        PublicPackagesController,
        EmployerSubscriptionController,
        PaymentController,
    ],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (redis: unknown) => redis,
            inject: [{ token: getRedisConnectionToken(), optional: true }],
        },
        SubscriptionRepository,
        PaymentRepository,
        PackagesService,
        SubscriptionService,
        SubscriptionExpiryService,
        PaymentService,
        DiscountService,
        EmployerEventsProcessor,
        // AppLogger is provided by LoggerModule (imported above) — listed here for clarity.
    ],
})
export class SubscriptionModule {}
