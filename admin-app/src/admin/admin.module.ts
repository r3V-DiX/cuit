// admin-app/src/admin/admin.module.ts
// Console auth is self-contained (Admin + AdminSession via AdminAuthGuard) —
// no auth-core session wiring, no dependency on the main auth-service.
// PermissionsGuard is used at controller level only (never APP_GUARD — it must
// run after AdminAuthGuard has attached req.admin).

import {
    Injectable,
    Logger,
    Module,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule, PrismaService } from '@cykruit/prisma';
import { CommonModule } from '@cykruit/common';
import { MailModule } from '@cykruit/mail';
import { RateLimitModule } from '@cykruit/rate-limit';
import { EventsModule } from '@cykruit/events';
import { AuthCoreModule } from '@cykruit/auth-core';
import { UploadModule } from '@cykruit/upload';

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
import { DiscountsController } from './controllers/discounts.controller';
import { AdminsController } from './controllers/admins.controller';
import { AdminInviteAcceptController } from './controllers/admin-invite-accept.controller';
import { ContactController } from './controllers/contact.controller';
import { SettingsController } from './controllers/settings.controller';
import { ReportsController } from './controllers/reports.controller';
import { MeController } from './controllers/me.controller';

// Services
import { KycService } from './services/kyc.service';
import { AdminJobsService } from './services/jobs.service';
import { UsersService } from './services/users.service';
import { RbacService } from './services/rbac.service';
import { SubscriptionService } from './services/subscription.service';
import { AuditQueryService } from './services/audit.service';
import { DashboardService } from './services/dashboard.service';
import { AdminAuditLogger } from './services/admin-audit.logger';
import { AdminAuthAuditLogger } from './services/admin-auth-audit.logger';
import { TestimonialsService } from './services/testimonials.service';
import { DiscountsService } from './services/discounts.service';
import { AdminsService } from './services/admins.service';
import { ContactService } from './services/contact.service';
import { SettingsService } from './services/settings.service';
import { ReportsService } from './services/reports.service';
import { PermissionsService } from './services/permissions.service';

// Repositories
import { KycRepository } from './repositories/kyc.repository';
import { AdminJobsRepository } from './repositories/jobs.repository';
import { UsersRepository } from './repositories/users.repository';
import { RbacRepository } from './repositories/rbac.repository';
import { AuditRepository } from './repositories/audit.repository';
import { DashboardRepository } from './repositories/dashboard.repository';
import { TestimonialsRepository } from './repositories/testimonials.repository';
import { DiscountsRepository } from './repositories/discounts.repository';
import { AdminsRepository } from './repositories/admins.repository';
import { ContactRepository } from './repositories/contact.repository';
import { SettingsRepository } from './repositories/settings.repository';
import { ReportsRepository } from './repositories/reports.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';

// Every root-admin protection in RbacService/AdminsService (see
// rbac/protected-admin.util.ts) is gated on RBAC_BOOTSTRAP_ADMIN_EMAIL resolving to
// a real, active admin. If it's unset or stale, those guards silently no-op — warn
// loudly at boot so that misconfiguration doesn't fail silently.
@Injectable()
export class RootAdminBootstrapCheck implements OnModuleInit {
    private readonly logger = new Logger(RootAdminBootstrapCheck.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {}

    async onModuleInit(): Promise<void> {
        const email = this.configService.get<string>('RBAC_BOOTSTRAP_ADMIN_EMAIL');

        if (!email) {
            this.logger.error(
                'RBAC_BOOTSTRAP_ADMIN_EMAIL is not set — no admin account is protected from ' +
                    'role/permission takeover by another super_admin.',
            );
            return;
        }

        const admin = await this.prisma.admin.findUnique({
            where: { email },
            select: { isActive: true },
        });

        if (!admin) {
            this.logger.warn(
                `RBAC_BOOTSTRAP_ADMIN_EMAIL is set to "${email}" but no matching admin exists — ` +
                    'root-admin protection is inactive.',
            );
        } else if (!admin.isActive) {
            this.logger.warn(
                `RBAC_BOOTSTRAP_ADMIN_EMAIL "${email}" resolves to a deactivated admin — ` +
                    'root-admin protection is inactive.',
            );
        }
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
        UploadModule,
        AuthCoreModule.forRoot({
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
        DiscountsController,
        AdminsController,
        AdminInviteAcceptController,
        ContactController,
        SettingsController,
        ReportsController,
        MeController,
    ],
    providers: [
        RootAdminBootstrapCheck,
        AdminAuthService,
        AdminAuthGuard,
        PermissionsService,
        PermissionsGuard,
        AdminAuditLogger,
        AdminAuthAuditLogger,
        // Services
        KycService,
        AdminJobsService,
        UsersService,
        RbacService,
        SubscriptionService,
        AuditQueryService,
        DashboardService,
        TestimonialsService,
        DiscountsService,
        AdminsService,
        ContactService,
        SettingsService,
        ReportsService,
        // Repositories
        KycRepository,
        AdminJobsRepository,
        UsersRepository,
        RbacRepository,
        AuditRepository,
        DashboardRepository,
        TestimonialsRepository,
        DiscountsRepository,
        AdminsRepository,
        ContactRepository,
        SettingsRepository,
        ReportsRepository,
        SubscriptionRepository,
    ],
})
export class AdminModule {}
