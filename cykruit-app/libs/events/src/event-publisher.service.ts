// libs/events/src/event-publisher.service.ts
// Fire-and-forget domain event publisher. Injects a Bull queue and pushes
// a strongly-typed DomainEvent job. The notification-service (and any future
// consumers) processes from the same Redis queue independently.

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { AppLogger } from '@cykruit/logger';
import { DOMAIN_EVENTS_QUEUE, DOMAIN_EVENT_JOB } from './events.constants';
import { DomainEvent, DomainEventType, DomainEventPayloadMap } from './events.types';

@Injectable()
export class EventPublisher {
    constructor(
        @InjectQueue(DOMAIN_EVENTS_QUEUE) private readonly queue: Queue,
        private readonly logger: AppLogger,
    ) {}

    /**
     * Publish a domain event. Fire-and-forget — never throws.
     * Failures are logged as warnings so the calling request never fails
     * because of an event publish error.
     */
    async publish<T extends DomainEventType>(
        type: T,
        payload: DomainEventPayloadMap[T],
        sourceService: string,
    ): Promise<void> {
        const event: DomainEvent<T> = {
            eventId: randomUUID(),
            type,
            payload,
            occurredAt: new Date().toISOString(),
            sourceService,
            version: 1,
        };

        try {
            await this.queue.add(DOMAIN_EVENT_JOB, event, {
                attempts: 5,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: true,
                removeOnFail: false,
            });
        } catch (err: any) {
            this.logger.warn(
                `[EventPublisher] Failed to publish event ${type}: ${err?.message}`,
                'EventPublisher',
            );
        }
    }
}
