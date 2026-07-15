// apps/subscription-service/src/subscription/subscription.module.ts

import { Injectable, Module, UnauthorizedException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import type { Request } from 'express';

import { PrismaModule, PrismaService } from '@cykruit/prisma';
import { CommonModule } from '@cykruit/common';
import { SubscriptionModule as EmployerLimitsModule } from '@cykruit/subscription';
import { RateLimitModule } from '@cykruit/rate-limit';
import { LoggerModule } from '@cykruit/logger';
import { EventsModule } from '@cykruit/events';
import { AuditModule } from '@cykruit/audit';
import { PermissionsModule } from '@cykruit/permissions';
import {
    AuthCoreModule,
    ISessionValidator,
    ISessionValidationResult,
    hashToken,
} from '@cykruit/auth-core';

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

@Injectable()
export class SubscriptionSessionValidator implements ISessionValidator {
    constructor(private readonly prisma: PrismaService) {}

    async validateSession(
        token: string,
        _ipAddress?: string,
        _userAgent?: string,
        _req?: Request,
    ): Promise<ISessionValidationResult> {
        const hashedToken = hashToken(token);

        const session = await this.prisma.session.findFirst({
            where: { token: hashedToken, isActive: true },
        });

        if (!session) throw new UnauthorizedException('Session not found or expired');

        if (session.expiresAt && new Date() > session.expiresAt) {
            await this.prisma.session.update({
                where: { id: session.id },
                data: { isActive: false, revokedAt: new Date(), revokedBy: 'expiry' },
            });
            throw new UnauthorizedException('Session expired');
        }

        const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
        if (!user) throw new UnauthorizedException('User not found');

        return { user };
    }
}

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
        EventsModule.forConsumer(),
        AuthCoreModule.forRoot({
            sessionValidatorClass: SubscriptionSessionValidator,
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
        SubscriptionSessionValidator,
        // AppLogger is provided by LoggerModule (imported above) — listed here for clarity.
    ],
})
export class SubscriptionModule {}
