// admin-app/src/common/core.module.ts
// @Global shared module: owns the cross-cutting providers (audit loggers, RBAC
// permission evaluation + guard) and the infra modules every feature depends on.
// Being @Global + re-exporting the infra keeps feature modules import-free.

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule } from '@cykruit/prisma';
import { CommonModule } from '@cykruit/common';
import { MailModule } from '@cykruit/mail';
import { RateLimitModule } from '@cykruit/rate-limit';
import { EventsModule } from '@cykruit/events';
import { UploadModule } from '@cykruit/upload';
import { AuthCoreModule } from '@cykruit/auth-core';

import { AdminAuditLogger } from './loggers/admin-audit.logger';
import { AdminAuthAuditLogger } from './loggers/admin-auth-audit.logger';
import { PermissionsService } from './services/permissions.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { RootAdminBootstrapCheck } from './root-admin-bootstrap.check';

const INFRA = [PrismaModule, CommonModule, MailModule, RateLimitModule, HttpModule, UploadModule];

@Global()
@Module({
    imports: [
        ConfigModule,
        ...INFRA,
        EventsModule.forPublisher(),
        AuthCoreModule.forRoot({
            imports: [PrismaModule, ConfigModule],
            enableCsrf: true,
        }),
    ],
    providers: [
        AdminAuditLogger,
        AdminAuthAuditLogger,
        PermissionsService,
        PermissionsGuard,
        RootAdminBootstrapCheck,
    ],
    exports: [
        AdminAuditLogger,
        AdminAuthAuditLogger,
        PermissionsService,
        PermissionsGuard,
        ...INFRA,
        EventsModule,
        AuthCoreModule,
        ConfigModule,
    ],
})
export class CoreModule {}
