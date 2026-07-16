import { Module } from "@nestjs/common";
import { PrismaModule } from "@cykruit/prisma";
import { ConfigModule } from "@nestjs/config";
import { AuthCoreModule, SharedSessionValidator } from "@cykruit/auth-core";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AuthCoreModule.forRoot({
      sessionValidatorClass: SharedSessionValidator,
      imports: [PrismaModule, ConfigModule],
      enableCsrf: false,
    }),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
