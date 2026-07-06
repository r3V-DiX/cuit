import { Module } from "@nestjs/common";
import { PrismaModule } from "@cykruit/prisma";
import { CertificationsController } from "./certifications.controller";
import { CertificationsService } from "./certifications.service";

@Module({
  imports: [PrismaModule],
  controllers: [CertificationsController],
  providers: [CertificationsService],
  exports: [CertificationsService],
})
export class CertificationsModule {}
