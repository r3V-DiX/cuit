// apps/auth-service/src/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { BullModule } from "@nestjs/bull";

import { AuthCoreModule } from "@cykruit/auth-core";
import { PrismaModule } from "@cykruit/prisma";
import { MailModule } from "@cykruit/mail";
import { CommonModule } from "@cykruit/common";
import { RateLimitModule } from "@cykruit/rate-limit";
import { AuditModule } from "@cykruit/audit";

import { AuthController } from "./controllers/auth.controller";
import { OAuthController } from "./controllers/oauth.controller";
import { VerificationController } from "./controllers/verification.controller";
import { PasswordController } from "./controllers/password.controller";
import { SessionsController } from "./controllers/sessions.controller";
import { AuditController } from "./controllers/audit.controller";

import { AuthService } from "./services/auth.service";
import { SessionService } from "./services/session.service";
import { SessionMobileService } from "./services/session-mobile.service";
import { VerificationService } from "./services/verification.service";
import { PasswordService } from "./services/password.service";
import { CleanupService } from "./services/cleanup.service";
import { OAuthBaseService } from "./services/oauth/oauth-base.service";
import { GoogleOAuthService } from "./services/oauth/google-oauth.service";
import { GitHubOAuthService } from "./services/oauth/github-oauth.service";
import { AuthRepository } from "./repositories/auth.repository";

// ✅ CsrfGuard import from local guards REMOVED — now lives in @cykruit/auth-core

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    MailModule,
    PrismaModule,
    RateLimitModule,
    AuditModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>("JWT_SECRET"),
        signOptions: { issuer: "cykruit-auth", audience: "cykruit-app" },
      }),
    }),

    BullModule.registerQueue({
      name: "notification-emails",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
      },
    }),

    AuthCoreModule.forRoot({
      sessionValidatorClass: SessionService,
      imports: [PrismaModule, ConfigModule],
      enableCsrf: true, // ✅ registers CsrfGuard as APP_GUARD for auth-service
    }),
  ],
  controllers: [
    AuthController,
    OAuthController,
    VerificationController,
    PasswordController,
    SessionsController,
    AuditController,
  ],
  providers: [
    AuthService,
    SessionService,
    SessionMobileService,
    VerificationService,
    PasswordService,
    CleanupService,
    OAuthBaseService,
    GoogleOAuthService,
    GitHubOAuthService,
    AuthRepository,
    // ✅ CsrfGuard and APP_GUARD registration REMOVED from here
    // Now handled inside AuthCoreModule.forRoot({ enableCsrf: true })
  ],
  exports: [AuthService, SessionService],
  // ✅ CsrfGuard removed from exports — imported from @cykruit/auth-core directly
})
export class AuthModule {}
