import { Module } from "@nestjs/common";
import { PrismaModule } from "@cykruit/prisma";
import { ConfigModule } from "@nestjs/config";
import { AuthCoreModule } from "@cykruit/auth-core";
import { SessionValidatorService } from "../session/session-validator.service";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AuthCoreModule.forRoot({
      sessionValidatorClass: SessionValidatorService,
      imports: [PrismaModule, ConfigModule],
      enableCsrf: false, // public service doesn't require global CSRF guards
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, SessionValidatorService],
  exports: [JobsService],
})
export class JobsModule {}
