// apps/notification-service/src/notification/notification.module.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import type { Request } from 'express';

import { PrismaModule, PrismaService } from '@cykruit/prisma';
import { CommonModule } from '@cykruit/common';
import { MailModule } from '@cykruit/mail';
import { RateLimitModule } from '@cykruit/rate-limit';
import {
    AuthCoreModule,
    ISessionValidator,
    ISessionValidationResult,
    SESSION_VALIDATOR,
    hashToken,
} from '@cykruit/auth-core';

import { EventsModule } from '@cykruit/events';

import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { WsTokenService } from './services/ws-token.service';
import { DigestSchedulerService } from './services/digest-scheduler.service';
import { NotificationRepository } from './repositories/notification.repository';
import { EmailDigestProcessor } from './processors/email-digest.processor';
import { DomainEventProcessor } from './processors/domain-event.processor';

export const NOTIFICATION_QUEUE = 'notification-email';

@Injectable()
export class NotificationSessionValidator implements ISessionValidator {
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

        if (!session) {
            throw new UnauthorizedException('Session not found or expired');
        }

        if (session.expiresAt && new Date() > session.expiresAt) {
            await this.prisma.session.update({
                where: { id: session.id },
                data: { isActive: false, revokedAt: new Date(), revokedBy: 'expiry' },
            });
            throw new UnauthorizedException('Session expired');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return { user };
    }
}

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
            sessionValidatorClass: NotificationSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: false,
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
        NotificationSessionValidator,
    ],
    exports: [NotificationService],
})
export class NotificationModule {}
