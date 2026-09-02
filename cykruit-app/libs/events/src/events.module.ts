// libs/events/src/events.module.ts
// Import EventsModule.forPublisher() in any service that needs to publish events.
// The module registers the shared Bull queue and exposes EventPublisher.

import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@cykruit/logger';
import { EventPublisher } from './event-publisher.service';
import { DOMAIN_EVENTS_QUEUE, EMPLOYER_LIFECYCLE_QUEUE } from './events.constants';

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
                BullModule.registerQueue(
                    { name: DOMAIN_EVENTS_QUEUE },
                    { name: EMPLOYER_LIFECYCLE_QUEUE },
                ),
            ],
            providers: [EventPublisher],
            exports: [EventPublisher],
        };
    }

    /**
     * Use in whichever service CONSUMES a domain-event queue.
     * Only registers the queue — the actual @Processor is registered separately.
     * Defaults to DOMAIN_EVENTS_QUEUE (notification-service); pass
     * EMPLOYER_LIFECYCLE_QUEUE for subscription-service's own listener.
     */
    static forConsumer(queueName: string = DOMAIN_EVENTS_QUEUE): DynamicModule {
        return {
            module: EventsModule,
            imports: [
                BullModule.registerQueue({ name: queueName }),
            ],
            exports: [BullModule],
        };
    }
}
