// apps/seeker-profile-service/src/profile/profile.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@cykruit/prisma';
import { UploadModule } from '@cykruit/upload';
import { CommonModule } from '@cykruit/common';
import { AuthCoreModule } from '@cykruit/auth-core';
import { RateLimitModule } from '@cykruit/rate-limit';

import { SessionValidatorService } from './session/session-validator.service';

// Controllers
import { ProfileController } from './controllers/profile.controller';
import { ExperienceController } from './controllers/experience.controller';
import { EducationController } from './controllers/education.controller';
import { SkillsController } from './controllers/skills.controller';
import { CertificationsController } from './controllers/certifications.controller';
import { ProjectsController } from './controllers/projects.controller';
import { CTFProfileController } from './controllers/ctf-profile.controller';
import { ResumeController } from './controllers/resume.controller';

// Services
import { ProfileService } from './services/profile.service';
import { ExperienceService } from './services/experience.service';
import { EducationService } from './services/education.service';
import { SkillsService } from './services/skills.service';
import { CertificationsService } from './services/certifications.service';
import { ProjectsService } from './services/projects.service';
import { CTFProfileService } from './services/ctf-profile.service';
import { ResumeService } from './services/resume.service';

// Helpers
import { ProfileHelpers } from './utils/profile.helpers';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        UploadModule,
        CommonModule,
        RateLimitModule,
        AuthCoreModule.forRoot({
            sessionValidatorClass: SessionValidatorService,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: true,
        }),
    ],
    controllers: [
        ProfileController,
        ExperienceController,
        EducationController,
        SkillsController,
        CertificationsController,
        ProjectsController,
        CTFProfileController,
        ResumeController,
    ],
    providers: [
        SessionValidatorService,
        ProfileHelpers,
        ProfileService,
        ExperienceService,
        EducationService,
        SkillsService,
        CertificationsService,
        ProjectsService,
        CTFProfileService,
        ResumeService,
    ],
})
export class SeekerProfileModule { }