// libs/events/src/event-publisher.service.ts
// Fire-and-forget domain event publisher. Injects a Bull queue and pushes
// a strongly-typed DomainEvent job. The notification-service (and any future
// consumers) processes from the same Redis queue independently.

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { AppLogger } from '@cykruit/logger';
import { DOMAIN_EVENTS_QUEUE, EMPLOYER_LIFECYCLE_QUEUE, DOMAIN_EVENT_JOB } from './events.constants';
import { DomainEvent, DomainEventType, DomainEventPayloadMap } from './events.types';

// Event types that also need to reach subscription-service's own listener
// (EmployerEventsProcessor). Kept as an explicit allowlist rather than
// mirroring every event onto that queue — only this processor listens there.
const EMPLOYER_LIFECYCLE_EVENT_TYPES: ReadonlySet<DomainEventType> = new Set([
    DomainEventType.EMPLOYER_SETUP_COMPLETE,
]);

@Injectable()
export class EventPublisher {
    constructor(
        @InjectQueue(DOMAIN_EVENTS_QUEUE) private readonly queue: Queue,
        @InjectQueue(EMPLOYER_LIFECYCLE_QUEUE) private readonly employerLifecycleQueue: Queue,
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

        const jobOptions = {
            attempts: 5,
            backoff: { type: 'exponential' as const, delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
        };

        try {
            await this.queue.add(DOMAIN_EVENT_JOB, event, jobOptions);
        } catch (err: any) {
            this.logger.warn(
                `[EventPublisher] Failed to publish event ${type}: ${err?.message}`,
                'EventPublisher',
            );
        }

        if (EMPLOYER_LIFECYCLE_EVENT_TYPES.has(type)) {
            try {
                await this.employerLifecycleQueue.add(DOMAIN_EVENT_JOB, event, jobOptions);
            } catch (err: any) {
                this.logger.warn(
                    `[EventPublisher] Failed to publish event ${type} to employer-lifecycle queue: ${err?.message}`,
                    'EventPublisher',
                );
            }
        }
    }
}
