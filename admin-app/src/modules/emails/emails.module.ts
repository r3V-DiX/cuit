// admin-app/src/modules/emails/emails.module.ts

import { Module } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailsRepository } from './emails.repository';

@Module({
    controllers: [EmailsController],
    providers: [EmailsService, EmailsRepository],
    exports: [EmailsService, EmailsRepository],
})
export class EmailsModule {}
