// apps/subscription-service/src/subscription/processors/employer-events.processor.ts

import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import {
    DOMAIN_EVENTS_QUEUE,
    DOMAIN_EVENT_JOB,
    DomainEvent,
    DomainEventType,
    EmployerSetupCompletePayload,
} from '@cykruit/events';
import { AppLogger } from '@cykruit/logger';
import { PaymentService } from '../services/payment.service';

@Processor(DOMAIN_EVENTS_QUEUE)
export class EmployerEventsProcessor {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly logger: AppLogger,
    ) {}

    @Process(DOMAIN_EVENT_JOB)
    async handle(job: Job<DomainEvent>): Promise<void> {
        const event = job.data;

        if (event.type !== DomainEventType.EMPLOYER_SETUP_COMPLETE) return;

        const payload = event.payload as EmployerSetupCompletePayload;
        this.logger.log(
            `[EmployerEventsProcessor] Auto-activating free tier for employer ${payload.employerId}`,
            'EmployerEventsProcessor',
        );

        try {
            await this.paymentService.activateFreeTierIfEligible(payload.employerId);
        } catch (err) {
            this.logger.error(
                `[EmployerEventsProcessor] Failed to activate free tier for employer ${payload.employerId}`,
                err,
                'EmployerEventsProcessor',
            );
            throw err;
        }
    }
}
