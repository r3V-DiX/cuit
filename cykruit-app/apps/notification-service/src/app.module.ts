// apps/notification-service/src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@nestjs-modules/ioredis';

import { PrismaModule } from '@cykruit/prisma';
import { LoggerModule } from '@cykruit/logger';
import { RequestContextModule, RequestContextMiddleware } from '@cykruit/context';
import { CommonModule } from '@cykruit/common';
import { MailModule } from '@cykruit/mail';
import { LoggerMiddleware } from '@cykruit/logger';

import { NotificationModule } from './notification/notification.module';
import { MessagingModule } from './messaging/messaging.module';

export const NOTIFICATION_QUEUE = 'notification-email';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath:
                process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
        }),

        RedisModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'single',
                url: `redis://${config.get('REDIS_HOST', 'localhost')}:${config.get('REDIS_PORT', 6379)}`,
                options: {
                    password: config.get('REDIS_PASSWORD') || undefined,
                    db: config.get<number>('REDIS_DB', 0),
                },
            }),
        }),

        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                redis: {
                    host: config.get('REDIS_HOST', 'localhost'),
                    port: config.get<number>('REDIS_PORT', 6379),
                    password: config.get('REDIS_PASSWORD') || undefined,
                    db: config.get<number>('REDIS_DB', 0),
                },
            }),
        }),

        RequestContextModule,
        LoggerModule,
        PrismaModule,
        MailModule,
        CommonModule,

        NotificationModule,
        MessagingModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestContextMiddleware).forRoutes('*');
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
