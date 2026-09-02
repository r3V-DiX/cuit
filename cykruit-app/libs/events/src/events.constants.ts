// libs/events/src/events.constants.ts

/** Bull queue consumed by notification-service — every domain event lands here. */
export const DOMAIN_EVENTS_QUEUE = 'domain-events';

/**
 * Separate Bull queue for the subset of events subscription-service's own
 * listener needs (e.g. EMPLOYER_SETUP_COMPLETE). Kept distinct from
 * DOMAIN_EVENTS_QUEUE — two @Processor classes sharing one queue/job name
 * would compete for the same jobs instead of each seeing every event.
 */
export const EMPLOYER_LIFECYCLE_QUEUE = 'employer-lifecycle-events';

/** Job name used on both queues above. */
export const DOMAIN_EVENT_JOB = 'domain-event';
