// admin-app/src/admin/admin.module.ts
// Console auth is self-contained (Admin + AdminSession via AdminAuthGuard) —
// no auth-core session wiring, no dependency on the main auth-service.
// PermissionsGuard is used at controller level only (never APP_GUARD — it must
// run after AdminAuthGuard has attached req.admin).

import { Injectable, Module, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import type { Request } from 'express';

import { PrismaModule, PrismaService } from '@cykruit/prisma';
import { CommonModule } from '@cykruit/common';
import { MailModule } from '@cykruit/mail';
import { RateLimitModule } from '@cykruit/rate-limit';
import { EventsModule } from '@cykruit/events';
import {
    AuthCoreModule,
    ISessionValidator,
    ISessionValidationResult,
    hashToken,
} from '@cykruit/auth-core';
import { UserRole } from '@prisma/client';

// Auth
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminAuthGuard } from './auth/admin-auth.guard';

// Guards
import { PermissionsGuard } from './guards/permissions.guard';

// Controllers
import { KycController } from './controllers/kyc.controller';
import { AdminJobsController } from './controllers/jobs.controller';
import { UsersController } from './controllers/users.controller';
import { RbacController } from './controllers/rbac.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { AuditController } from './controllers/audit.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { TestimonialsController } from './controllers/testimonials.controller';

// Services
import { KycService } from './services/kyc.service';
import { AdminJobsService } from './services/jobs.service';
import { UsersService } from './services/users.service';
import { RbacService } from './services/rbac.service';
import { SubscriptionService } from './services/subscription.service';
import { AuditQueryService } from './services/audit.service';
import { DashboardService } from './services/dashboard.service';
import { AdminAuditLogger } from './services/admin-audit.logger';
import { TestimonialsService } from './services/testimonials.service';
import { PermissionsService } from './services/permissions.service';

// Repositories
import { KycRepository } from './repositories/kyc.repository';
import { AdminJobsRepository } from './repositories/jobs.repository';
import { UsersRepository } from './repositories/users.repository';
import { RbacRepository } from './repositories/rbac.repository';
import { AuditRepository } from './repositories/audit.repository';
import { DashboardRepository } from './repositories/dashboard.repository';
import { TestimonialsRepository } from './repositories/testimonials.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';

@Injectable()
export class AdminSessionValidator implements ISessionValidator {
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

        // Hard block at session validation layer — admin domain only
        if (user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Admin access only');
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
        HttpModule,
        EventsModule.forPublisher(),
        AuthCoreModule.forRoot({
            sessionValidatorClass: AdminSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: true,
        }),
    ],
    controllers: [
        AdminAuthController,
        KycController,
        AdminJobsController,
        UsersController,
        RbacController,
        SubscriptionController,
        AuditController,
        DashboardController,
        TestimonialsController,
    ],
    providers: [
        AdminSessionValidator,
        AdminAuthService,
        AdminAuthGuard,
        PermissionsService,
        PermissionsGuard,
        AdminAuditLogger,
        // Services
        KycService,
        AdminJobsService,
        UsersService,
        RbacService,
        SubscriptionService,
        AuditQueryService,
        DashboardService,
        TestimonialsService,
        // Repositories
        KycRepository,
        AdminJobsRepository,
        UsersRepository,
        RbacRepository,
        AuditRepository,
        DashboardRepository,
        TestimonialsRepository,
        SubscriptionRepository,
    ],
})
export class AdminModule {}
