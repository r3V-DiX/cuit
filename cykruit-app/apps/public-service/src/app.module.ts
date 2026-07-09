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
        url: `redis://${config.get("REDIS_HOST", "localhost")}:${config.get("REDIS_PORT", 6379)}`,
        options: {
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
