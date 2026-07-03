import { Module } from "@nestjs/common";
import { PrismaModule } from "@cykruit/prisma";
import { MailModule } from "@cykruit/mail";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "@cykruit/logger";
import { ContactController } from "./contact.controller";
import { ContactService } from "./contact.service";

@Module({
  imports: [PrismaModule, MailModule, ConfigModule, LoggerModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
