import { Module } from "@nestjs/common";
import { PrismaModule } from "@cykruit/prisma";
import { ConfigModule } from "@nestjs/config";
import { AuthCoreModule, SharedSessionValidator } from "@cykruit/auth-core";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AuthCoreModule.forRoot({
      sessionValidatorClass: SharedSessionValidator,
      imports: [PrismaModule, ConfigModule],
      enableCsrf: false, // public service doesn't require global CSRF guards
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
