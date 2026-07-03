// apps/user-settings-service/src/settings/settings.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { AuthCoreModule } from "@cykruit/auth-core";
import { PrismaModule } from "@cykruit/prisma";
import { CommonModule } from "@cykruit/common";
import { RateLimitModule } from "@cykruit/rate-limit";

import { SeekerSettingsController } from "./controllers/seeker-settings.controller";
import { EmployerSettingsController } from "./controllers/employer-settings.controller";

import { SeekerSettingsService } from "./services/seeker-settings.service";
import { EmployerSettingsService } from "./services/employer-settings.service";
import { NotificationPreferenceService } from "./services/notification-preference.service";
import { LocationPreferenceService } from "./services/location-preference.service";

import { SeekerSettingsRepository } from "./repositories/seeker-settings.repository";
import { EmployerSettingsRepository } from "./repositories/employer-settings.repository";
import { NotificationPreferenceRepository } from "./repositories/notification-preference.repository";
import { LocationPreferenceRepository } from "./repositories/location-preference.repository";

import { SessionValidatorService } from "./session/session-validator.service";

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    PrismaModule,
    RateLimitModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>("JWT_SECRET"),
        signOptions: { issuer: "cykruit-auth", audience: "cykruit-app" },
      }),
    }),

    AuthCoreModule.forRoot({
      sessionValidatorClass: SessionValidatorService,
      imports: [PrismaModule, ConfigModule],
      enableCsrf: true, // ✅ now settings service is also CSRF protected
    }),
  ],
  controllers: [SeekerSettingsController, EmployerSettingsController],
  providers: [
    SeekerSettingsService,
    EmployerSettingsService,
    NotificationPreferenceService,
    LocationPreferenceService,

    SeekerSettingsRepository,
    EmployerSettingsRepository,
    NotificationPreferenceRepository,
    LocationPreferenceRepository,

    SessionValidatorService,
  ],
})
export class UserSettingsModule {}
