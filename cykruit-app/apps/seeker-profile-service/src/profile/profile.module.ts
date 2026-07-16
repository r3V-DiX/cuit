// apps/seeker-profile-service/src/profile/profile.module.ts

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PrismaModule } from "@cykruit/prisma";
import { UploadModule } from "@cykruit/upload";
import { CommonModule } from "@cykruit/common";
import { AuthCoreModule, SharedSessionValidator } from "@cykruit/auth-core";
import { RateLimitModule } from "@cykruit/rate-limit";
import { AuditModule } from "@cykruit/audit";
import { QueueModule } from "@cykruit/queue";

// Session validation moved to SharedSessionValidator (@cykruit/auth-core) —
// see docs/SESSION_MEMORY.md.

// Controllers
import { ProfileController } from "./controllers/profile.controller";
import { ExperienceController } from "./controllers/experience.controller";
import { EducationController } from "./controllers/education.controller";
import { SkillsController } from "./controllers/skills.controller";
import { CertificationsController } from "./controllers/certifications.controller";
import { ProjectsController } from "./controllers/projects.controller";
import { CTFProfileController } from "./controllers/ctf-profile.controller";
import { ResumeController } from "./controllers/resume.controller";

// Services
import { ProfileService } from "./services/profile.service";
import { ExperienceService } from "./services/experience.service";
import { EducationService } from "./services/education.service";
import { SkillsService } from "./services/skills.service";
import { CertificationsService } from "./services/certifications.service";
import { ProjectsService } from "./services/projects.service";
import { CTFProfileService } from "./services/ctf-profile.service";
import { ResumeService } from "./services/resume.service";

// Helpers
import { ProfileHelpers } from "./utils/profile.helpers";
import { AIProfileService } from "./services/ai-profile.service";
import { AIProfileController } from "./controllers/ai-profile.controller";
import { AIModule, AI_QUEUES } from "@cykruit/ai";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UploadModule,
    CommonModule,
    RateLimitModule,
    AuditModule,
    QueueModule.forRoot({ queues: [AI_QUEUES.AI_JOBS] }),
    AIModule,
    AuthCoreModule.forRoot({
      sessionValidatorClass: SharedSessionValidator,
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
    AIProfileController,
  ],
  providers: [
    ProfileHelpers,
    ProfileService,
    ExperienceService,
    EducationService,
    SkillsService,
    CertificationsService,
    ProjectsService,
    CTFProfileService,
    ResumeService,
    AIProfileService,
  ],
})
export class SeekerProfileModule {}
