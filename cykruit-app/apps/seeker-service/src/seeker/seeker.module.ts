// apps/seeker-service/src/seeker/seeker.module.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { Request } from 'express';

import { PrismaModule, PrismaService } from '@cykruit/prisma';
import { CommonModule } from '@cykruit/common';
import { AuditModule } from '@cykruit/audit';
import { RateLimitModule } from '@cykruit/rate-limit';
import { AIModule } from '@cykruit/ai';
import { EventsModule } from '@cykruit/events';
import {
    AuthCoreModule,
    ISessionValidator,
    ISessionValidationResult,
    SESSION_VALIDATOR,
    hashToken,
} from '@cykruit/auth-core';

import { JobsController } from './controllers/jobs.controller';
import { ApplicationsController } from './controllers/applications.controller';
import { SavedJobsController } from './controllers/saved-jobs.controller';

import { JobsService } from './services/jobs.service';
import { ApplicationsService } from './services/applications.service';
import { SavedJobsService } from './services/saved-jobs.service';

import { JobsRepository } from './repositories/jobs.repository';
import { ApplicationsRepository } from './repositories/applications.repository';
import { SavedJobsRepository } from './repositories/saved-jobs.repository';

@Injectable()
export class SeekerSessionValidator implements ISessionValidator {
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
        AuditModule,
        RateLimitModule,
        AIModule,
        EventsModule.forPublisher(),
        AuthCoreModule.forRoot({
            sessionValidatorClass: SeekerSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: false,
        }),
    ],
    controllers: [
        JobsController,
        ApplicationsController,
        SavedJobsController,
    ],
    providers: [
        JobsService,
        JobsRepository,
        ApplicationsService,
        ApplicationsRepository,
        SavedJobsService,
        SavedJobsRepository,
        SeekerSessionValidator,
    ],
})
export class SeekerModule {}
