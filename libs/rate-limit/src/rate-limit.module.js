"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const throttler_storage_redis_1 = require("@nest-lab/throttler-storage-redis");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const rate_limit_guard_1 = require("./rate-limit.guard");
const isDev = process.env.NODE_ENV === 'development';
let RateLimitModule = class RateLimitModule {
};
exports.RateLimitModule = RateLimitModule;
exports.RateLimitModule = RateLimitModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    storage: new throttler_storage_redis_1.ThrottlerStorageRedisService({
                        host: config.get('REDIS_HOST', 'localhost'),
                        port: config.get('REDIS_PORT', 6379),
                        password: config.get('REDIS_PASSWORD'),
                        db: config.get('REDIS_THROTTLER_DB', 2),
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
                provide: core_1.APP_GUARD,
                useClass: rate_limit_guard_1.RateLimitGuard,
            },
        ],
        exports: [throttler_1.ThrottlerModule],
    })
], RateLimitModule);
