import { Module, Global } from '@nestjs/common';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

const isDev = process.env.NODE_ENV === 'development';

@Global()
@Module({
    imports: [
        ConfigModule,
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
                storage: new ThrottlerStorageRedisService({
                    host: config.get('REDIS_HOST', 'localhost'),
                    port: config.get<number>('REDIS_PORT', 6379),
                    password: config.get('REDIS_PASSWORD'),
                    db: config.get<number>('REDIS_THROTTLER_DB', 2),
                }),
                throttlers: [
                    {
                        name: 'global',
                        ttl: 60_000,
                        limit: 500, // ✅ raised from 120 to 500 in prod
                    },
                    {
                        name: 'login',
                        ttl: 15 * 60_000,
                        limit: isDev ? 10000 : 10,
                    },
                    {
                        name: 'register',
                        ttl: 60 * 60_000,
                        limit: isDev ? 10000 : 5,
                    },
                    {
                        name: 'forgot_password',
                        ttl: 60 * 60_000,
                        limit: isDev ? 10000 : 3,
                    },
                    {
                        name: 'resend_verification',
                        ttl: 60 * 60_000,
                        limit: isDev ? 10000 : 3,
                    },
                    {
                        name: 'verify_email',
                        ttl: 60 * 60_000,
                        limit: isDev ? 10000 : 10,
                    },
                    {
                        name: 'refresh_token',
                        ttl: 60_000,
                        limit: isDev ? 10000 : 20,
                    },
                    {
                        name: 'oauth',
                        ttl: 60_000,
                        limit: isDev ? 10000 : 20,
                    },
                ],
            }),
        }),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: RateLimitGuard,
        },
    ],
    exports: [ThrottlerModule],
})
export class RateLimitModule { }