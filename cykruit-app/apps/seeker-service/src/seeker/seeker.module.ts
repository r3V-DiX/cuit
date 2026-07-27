// apps/seeker-service/src/seeker/seeker.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@cykruit/prisma';
import { CommonModule } from '@cykruit/common';
import { AuditModule } from '@cykruit/audit';
import { RateLimitModule } from '@cykruit/rate-limit';
import { AIModule } from '@cykruit/ai';
import { EventsModule } from '@cykruit/events';
import { AuthCoreModule, SharedSessionValidator } from '@cykruit/auth-core';

import { JobsController } from './controllers/jobs.controller';
import { ApplicationsController } from './controllers/applications.controller';
import { SavedJobsController } from './controllers/saved-jobs.controller';
import { ActivityController } from './controllers/activity.controller';

import { JobsService } from './services/jobs.service';
import { ApplicationsService } from './services/applications.service';
import { SavedJobsService } from './services/saved-jobs.service';
import { ActivityService } from './services/activity.service';

import { JobsRepository } from './repositories/jobs.repository';
import { ApplicationsRepository } from './repositories/applications.repository';
import { SavedJobsRepository } from './repositories/saved-jobs.repository';
import { ActivityRepository } from './repositories/activity.repository';

// Session validation moved to SharedSessionValidator (@cykruit/auth-core) —
// see docs/SESSION_MEMORY.md.

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
            sessionValidatorClass: SharedSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: true,
        }),
    ],
    controllers: [
        JobsController,
        ApplicationsController,
        SavedJobsController,
        ActivityController,
    ],
    providers: [
        JobsService,
        JobsRepository,
        ApplicationsService,
        ApplicationsRepository,
        SavedJobsService,
        SavedJobsRepository,
        ActivityService,
        ActivityRepository,
    ],
})
export class SeekerModule {}
