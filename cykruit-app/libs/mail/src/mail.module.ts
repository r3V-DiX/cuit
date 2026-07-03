// libs/mail/mail.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { LoggerModule } from '@cykruit/logger';

@Global()
@Module({
    imports: [ConfigModule, LoggerModule],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }