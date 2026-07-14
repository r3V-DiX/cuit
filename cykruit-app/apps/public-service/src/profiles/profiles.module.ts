import { Module } from "@nestjs/common";
import { PrismaModule } from "@cykruit/prisma";
import { ConfigModule } from "@nestjs/config";
import { AuthCoreModule } from "@cykruit/auth-core";
import { SessionValidatorService } from "../session/session-validator.service";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AuthCoreModule.forRoot({
      sessionValidatorClass: SessionValidatorService,
      imports: [PrismaModule, ConfigModule],
      enableCsrf: false,
    }),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService, SessionValidatorService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
