import { Module } from '@nestjs/common';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { PrismaModule } from '@cykruit/prisma';
import { EmployerLimitsService } from './services/employer-limits.service';

@Module({
    imports: [PrismaModule],
    providers: [
        EmployerLimitsService,
        {
            provide: 'REDIS_CLIENT',
            useFactory: (redis: unknown) => redis,
            inject: [{ token: getRedisConnectionToken(), optional: true }],
        },
    ],
    exports: [EmployerLimitsService],
})
export class SubscriptionModule {}
