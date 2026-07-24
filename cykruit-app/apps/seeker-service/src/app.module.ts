// apps/seeker-service/src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@nestjs-modules/ioredis';

import { PrismaModule } from '@cykruit/prisma';
import { LoggerModule } from '@cykruit/logger';
import { RequestContextModule, RequestContextMiddleware } from '@cykruit/context';
import { CommonModule } from '@cykruit/common';
import { LoggerMiddleware } from '@cykruit/logger';

import { SeekerModule } from './seeker/seeker.module';

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
                options: {
                    host: config.get<string>('REDIS_HOST', 'localhost'),
                    port: config.get<number>('REDIS_PORT', 6379),
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
        CommonModule,

        SeekerModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestContextMiddleware).forRoutes('*');
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
