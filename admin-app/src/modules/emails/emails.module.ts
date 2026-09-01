// admin-app/src/modules/emails/emails.module.ts

import { Module } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailsRepository } from './emails.repository';
import { ResendAdminService } from './resend.service';

@Module({
    controllers: [EmailsController],
    providers: [EmailsService, EmailsRepository, ResendAdminService],
    exports: [EmailsService, EmailsRepository, ResendAdminService],
})
export class EmailsModule {}
