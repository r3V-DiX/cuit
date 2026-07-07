// apps/employer-service/src/employer/employer.module.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import type { Request } from 'express';

import { PrismaModule, PrismaService } from '@cykruit/prisma';
import { MailModule } from '@cykruit/mail';
import { CommonModule } from '@cykruit/common';
import { UploadModule } from '@cykruit/upload';
import { AuditModule } from '@cykruit/audit';
import { RateLimitModule } from '@cykruit/rate-limit';
import { EventsModule } from '@cykruit/events';
import {
    AuthCoreModule,
    ISessionValidator,
    ISessionValidationResult,
    hashToken,
} from '@cykruit/auth-core';

// Controllers
import { CompanyController } from './controllers/company.controller';
import { KycController } from './controllers/kyc.controller';
import { JobsController } from './controllers/jobs.controller';
import { TeamController } from './controllers/team.controller';
import { ApplicationsController } from './controllers/applications.controller';

// Services
import { CompanyService } from './services/company.service';
import { KycService } from './services/kyc.service';
import { JobsService } from './services/jobs.service';
import { TeamService } from './services/team.service';
import { EmployerApplicationsService } from './services/applications.service';
import { JobExpiryService } from './services/job-expiry.service';

// Repositories
import { CompanyRepository } from './repositories/company.repository';
import { KycRepository } from './repositories/kyc.repository';
import { JobsRepository } from './repositories/jobs.repository';
import { TeamRepository } from './repositories/team.repository';
import { EmployerApplicationsRepository } from './repositories/applications.repository';

/**
 * EmployerSessionValidator validates bearer/cookie session tokens from the
 * shared sessions table using the same logic as auth-service's SessionService.
 *
 * It is intentionally lightweight — it does NOT perform session rotation,
 * fingerprint checks, or audit logging so that read-heavy employer routes
 * stay fast. If the employer service later needs rotation it should delegate
 * to a fully-featured SessionService instance.
 */
@Injectable()
export class EmployerSessionValidator implements ISessionValidator {
    constructor(private readonly prisma: PrismaService) {}

    async validateSession(
        token: string,
        ipAddress?: string,
        userAgent?: string,
        req?: Request,
    ): Promise<ISessionValidationResult> {
        const hashedToken = hashToken(token);

        const session = await this.prisma.session.findFirst({
            where: { token: hashedToken, isActive: true },
        });

        if (!session) {
            throw new UnauthorizedException('Session not found or expired');
        }

        if (session.expiresAt && new Date() > session.expiresAt) {
            // Mark expired so subsequent lookups skip it
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
        MailModule,
        CommonModule,
        UploadModule,
        AuditModule,
        RateLimitModule,
        ScheduleModule.forRoot(),
        EventsModule.forPublisher(),
        AuthCoreModule.forRoot({
            sessionValidatorClass: EmployerSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: false,
        }),
    ],
    controllers: [
        CompanyController,
        KycController,
        JobsController,
        TeamController,
        ApplicationsController,
    ],
    providers: [
        CompanyService,
        CompanyRepository,
        KycService,
        KycRepository,
        JobsService,
        JobsRepository,
        TeamService,
        TeamRepository,
        EmployerApplicationsService,
        EmployerApplicationsRepository,
        JobExpiryService,
        EmployerSessionValidator,
    ],
    exports: [CompanyService],
})
export class EmployerModule {}
