// apps/employer-service/src/employer/employer.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';

import { PrismaModule } from '@cykruit/prisma';
import { MailModule } from '@cykruit/mail';
import { CommonModule } from '@cykruit/common';
import { UploadModule } from '@cykruit/upload';
import { AuditModule } from '@cykruit/audit';
import { RateLimitModule } from '@cykruit/rate-limit';
import { EventsModule } from '@cykruit/events';
import { QueueModule } from '@cykruit/queue';
import { AI_QUEUES } from '@cykruit/ai';
import { AuthCoreModule, SharedSessionValidator } from '@cykruit/auth-core';
import { PermissionsModule } from '@cykruit/permissions';
import { SubscriptionModule } from '@cykruit/subscription';

// Controllers
import { CompanyController } from './controllers/company.controller';
import { KycController } from './controllers/kyc.controller';
import { JobsController } from './controllers/jobs.controller';
import { TeamController } from './controllers/team.controller';
import { ApplicationsController } from './controllers/applications.controller';
import { ActivityController } from './controllers/activity.controller';

// Services
import { CompanyService } from './services/company.service';
import { KycService } from './services/kyc.service';
import { JobsService } from './services/jobs.service';
import { TeamService } from './services/team.service';
import { EmployerApplicationsService } from './services/applications.service';
import { JobExpiryService } from './services/job-expiry.service';
import { ActivityService } from './services/activity.service';

// Repositories
import { CompanyRepository } from './repositories/company.repository';
import { KycRepository } from './repositories/kyc.repository';
import { JobsRepository } from './repositories/jobs.repository';
import { TeamRepository } from './repositories/team.repository';
import { EmployerApplicationsRepository } from './repositories/applications.repository';
import { ActivityRepository } from './repositories/activity.repository';

// Guards
import { KycVerifiedGuard } from './guards/kyc-verified.guard';

// Session validation moved to SharedSessionValidator (@cykruit/auth-core) —
// see docs/SESSION_MEMORY.md. Was previously a hand-copied, lighter-weight
// validator with no rotation/fingerprint/status checks; now shares the same
// canonical implementation every other service uses.

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        MailModule,
        CommonModule,
        UploadModule,
        AuditModule,
        RateLimitModule,
        PermissionsModule,
        SubscriptionModule,
        ScheduleModule.forRoot(),
        EventsModule.forPublisher(),
        QueueModule.forRoot({ queues: [AI_QUEUES.AI_JOBS] }),
        AuthCoreModule.forRoot({
            sessionValidatorClass: SharedSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: true,
        }),
    ],
    controllers: [
        CompanyController,
        KycController,
        JobsController,
        TeamController,
        ApplicationsController,
        ActivityController,
    ],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (redis: unknown) => redis,
            inject: [{ token: getRedisConnectionToken(), optional: true }],
        },
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
        ActivityService,
        ActivityRepository,
        KycVerifiedGuard,
    ],
    exports: [CompanyService],
})
export class EmployerModule {}
