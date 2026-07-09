// apps/notification-service/src/messaging/messaging.module.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { Request } from 'express';

import { PrismaModule, PrismaService } from '@cykruit/prisma';
import {
    AuthCoreModule,
    ISessionValidator,
    ISessionValidationResult,
    SESSION_VALIDATOR,
    hashToken,
} from '@cykruit/auth-core';

import { MessagingController } from './controllers/messaging.controller';
import { MessagingService } from './services/messaging.service';
import { MessagingRepository } from './repositories/messaging.repository';
import { MessagingGateway } from './gateways/messaging.gateway';

@Injectable()
export class MessagingSessionValidator implements ISessionValidator {
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
        AuthCoreModule.forRoot({
            sessionValidatorClass: MessagingSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: false,
        }),
    ],
    controllers: [MessagingController],
    providers: [MessagingService, MessagingRepository, MessagingSessionValidator, MessagingGateway],
    exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
