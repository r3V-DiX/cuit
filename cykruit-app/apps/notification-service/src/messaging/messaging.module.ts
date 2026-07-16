// apps/notification-service/src/messaging/messaging.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@cykruit/prisma';
import { AuthCoreModule, SharedSessionValidator } from '@cykruit/auth-core';

import { MessagingController } from './controllers/messaging.controller';
import { MessagingService } from './services/messaging.service';
import { MessagingRepository } from './repositories/messaging.repository';
import { MessagingGateway } from './gateways/messaging.gateway';

// Session validation moved to SharedSessionValidator (@cykruit/auth-core) —
// see docs/SESSION_MEMORY.md.

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        AuthCoreModule.forRoot({
            sessionValidatorClass: SharedSessionValidator,
            imports: [PrismaModule, ConfigModule],
            enableCsrf: true,
        }),
    ],
    controllers: [MessagingController],
    providers: [MessagingService, MessagingRepository, MessagingGateway],
    exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
