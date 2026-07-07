// libs/events/src/events.module.ts
// Import EventsModule.forPublisher() in any service that needs to publish events.
// The module registers the shared Bull queue and exposes EventPublisher.

import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@cykruit/logger';
import { EventPublisher } from './event-publisher.service';
import { DOMAIN_EVENTS_QUEUE } from './events.constants';

@Module({})
export class EventsModule {
    /**
     * Use in any service that PUBLISHES events (seeker, employer, admin, subscription).
     * Registers the Bull queue connection + EventPublisher provider.
     */
    static forPublisher(): DynamicModule {
        return {
            module: EventsModule,
            imports: [
                ConfigModule,
                LoggerModule,
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
                BullModule.registerQueue({ name: DOMAIN_EVENTS_QUEUE }),
            ],
            providers: [EventPublisher],
            exports: [EventPublisher],
        };
    }

    /**
     * Use in notification-service (the CONSUMER).
     * Only registers the queue — processor is registered separately.
     */
    static forConsumer(): DynamicModule {
        return {
            module: EventsModule,
            imports: [
                BullModule.registerQueue({ name: DOMAIN_EVENTS_QUEUE }),
            ],
            exports: [BullModule],
        };
    }
}
