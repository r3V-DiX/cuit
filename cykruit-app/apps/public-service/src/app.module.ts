import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "@nestjs-modules/ioredis";

import { PrismaModule } from "@cykruit/prisma";
import { LoggerModule, LoggerMiddleware } from "@cykruit/logger";
import {
  RequestContextModule,
  RequestContextMiddleware,
} from "@cykruit/context";
import { CommonModule } from "@cykruit/common";
import { RateLimitModule } from "@cykruit/rate-limit";
import { UploadModule } from "@cykruit/upload";

// Domain Modules
import { LocationsModule } from "./locations/locations.module";
import { SkillsModule } from "./skills/skills.module";
import { CertificationsModule } from "./certifications/certifications.module";
import { RolesModule } from "./roles/roles.module";
import { CmsModule } from "./cms/cms.module";
import { ContactModule } from "./contact/contact.module";
import { JobsModule } from "./jobs/jobs.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { TestimonialsModule } from "./testimonials/testimonials.module";
import { AnnouncementsModule } from "./announcements/announcements.module";
import { SuggestionsModule } from "./suggestions/suggestions.module";
import { DomainsModule } from "./domains/domains.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === "production" ? ".env.production" : ".env",
    }),

    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "single",
        options: {
          host: config.get<string>("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
          password: config.get("REDIS_PASSWORD") || undefined,
          db: config.get<number>("REDIS_DB", 0),
        },
      }),
    }),

    RequestContextModule,
    LoggerModule,
    PrismaModule,
    CommonModule,
    RateLimitModule,
    UploadModule,

    // Domain Modules
    LocationsModule,
    SkillsModule,
    CertificationsModule,
    RolesModule,
    CmsModule,
    ContactModule,
    JobsModule,
    ProfilesModule,
    TestimonialsModule,
    AnnouncementsModule,
    SuggestionsModule,
    DomainsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
