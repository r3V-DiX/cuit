// libs/events/src/events.types.ts
// Strongly-typed domain event contracts. Every service that publishes an event
// must use these types. The notification-service consumer maps them to Notification rows.

export enum DomainEventType {
    // ── Application ───────────────────────────────────────────────────────────
    APPLICATION_SUBMITTED       = 'application.submitted',        // seeker applied
    APPLICATION_STATUS_CHANGED  = 'application.status_changed',   // employer changed status
    APPLICATION_WITHDRAWN       = 'application.withdrawn',        // seeker withdrew

    // ── Job ───────────────────────────────────────────────────────────────────
    JOB_APPROVED                = 'job.approved',                 // admin approved
    JOB_REJECTED                = 'job.rejected',                 // admin rejected
    JOB_EXPIRING_SOON           = 'job.expiring_soon',            // cron: 3 days left

    // ── KYC ───────────────────────────────────────────────────────────────────
    KYC_APPROVED                = 'kyc.approved',                 // admin approved
    KYC_REJECTED                = 'kyc.rejected',                 // admin rejected

    // ── Team ──────────────────────────────────────────────────────────────────
    TEAM_INVITE_SENT            = 'team.invite_sent',             // employer invited member

    // ── Account ───────────────────────────────────────────────────────────────
    ACCOUNT_SUSPENDED           = 'account.suspended',            // admin suspended user
    ACCOUNT_UNSUSPENDED         = 'account.unsuspended',          // admin unsuspended

    // ── Subscription ─────────────────────────────────────────────────────────
    SUBSCRIPTION_EXPIRED          = 'subscription.expired',           // cron: plan expired
    SUBSCRIPTION_ASSIGNED         = 'subscription.assigned',          // admin assigned plan
    SUBSCRIPTION_PAYMENT_CAPTURED = 'subscription.payment_captured',  // razorpay payment confirmed
    SUBSCRIPTION_RENEWED          = 'subscription.renewed',           // plan renewed after payment
    SUBSCRIPTION_CANCELLED        = 'subscription.cancelled',         // employer or admin cancelled plan

    // ── Employer ─────────────────────────────────────────────────────────────
    EMPLOYER_SETUP_COMPLETE       = 'employer.setup_complete',         // employer finished company setup
}

// ── Payload types per event ────────────────────────────────────────────────────

export interface ApplicationSubmittedPayload {
    applicationId: string;
    jobId: string;
    jobTitle: string;
    seekerId: string;
    seekerName: string;
    employerId: string;
    employerUserId: string; // owner user ID to notify
}

export interface ApplicationStatusChangedPayload {
    applicationId: string;
    jobId: string;
    jobTitle: string;
    seekerId: string;
    oldStatus: string;
    newStatus: string;
    employerNote?: string;
}

export interface ApplicationWithdrawnPayload {
    applicationId: string;
    jobId: string;
    jobTitle: string;
    seekerId: string;
    employerId: string;
}

export interface JobApprovedPayload {
    jobId: string;
    jobTitle: string;
    employerId: string;
    employerUserId: string;
}

export interface JobRejectedPayload {
    jobId: string;
    jobTitle: string;
    employerId: string;
    employerUserId: string;
    rejectionReason: string;
}

export interface JobExpiringSoonPayload {
    jobId: string;
    jobTitle: string;
    employerId: string;
    employerUserId: string;
    expiresAt: string; // ISO string
}

export interface KycApprovedPayload {
    verificationId: string;
    employerId: string;
    employerUserId: string;
    companyName: string;
}

export interface KycRejectedPayload {
    verificationId: string;
    employerId: string;
    employerUserId: string;
    companyName: string;
    rejectionReason: string;
}

export interface TeamInviteSentPayload {
    inviteToken: string;
    employerId: string;
    companyName: string;
    invitedEmail: string;
    invitedUserId?: string; // set if invitee already has an account
    role: string;
}

export interface AccountSuspendedPayload {
    userId: string;
    reason?: string;
    suspendedBy: string;
}

export interface AccountUnsuspendedPayload {
    userId: string;
    unsuspendedBy: string;
}

export interface SubscriptionExpiredPayload {
    subscriptionId: string;
    employerId: string;
    employerUserId: string;
    packageName: string;
}

export interface SubscriptionAssignedPayload {
    subscriptionId: string;
    employerId: string;
    employerUserId: string;
    packageName: string;
    expiresAt?: string;
}

export interface SubscriptionPaymentCapturedPayload {
    orderId: string;
    paymentId: string;
    employerId: string;
    employerUserId: string;
    packageName: string;
    billingCycle: string;
    amountPaise: number;
}

export interface SubscriptionRenewedPayload {
    subscriptionId: string;
    employerId: string;
    employerUserId: string;
    packageName: string;
    billingCycle: string;
    expiresAt: string;
}

export interface SubscriptionCancelledPayload {
    subscriptionId: string;
    employerId: string;
    employerUserId: string;
    packageName: string;
}

export interface EmployerSetupCompletePayload {
    employerId: string;
    userId: string;
}

// ── Discriminated union ────────────────────────────────────────────────────────

export type DomainEventPayloadMap = {
    [DomainEventType.APPLICATION_SUBMITTED]:          ApplicationSubmittedPayload;
    [DomainEventType.APPLICATION_STATUS_CHANGED]:     ApplicationStatusChangedPayload;
    [DomainEventType.APPLICATION_WITHDRAWN]:          ApplicationWithdrawnPayload;
    [DomainEventType.JOB_APPROVED]:                   JobApprovedPayload;
    [DomainEventType.JOB_REJECTED]:                   JobRejectedPayload;
    [DomainEventType.JOB_EXPIRING_SOON]:              JobExpiringSoonPayload;
    [DomainEventType.KYC_APPROVED]:                   KycApprovedPayload;
    [DomainEventType.KYC_REJECTED]:                   KycRejectedPayload;
    [DomainEventType.TEAM_INVITE_SENT]:               TeamInviteSentPayload;
    [DomainEventType.ACCOUNT_SUSPENDED]:              AccountSuspendedPayload;
    [DomainEventType.ACCOUNT_UNSUSPENDED]:            AccountUnsuspendedPayload;
    [DomainEventType.SUBSCRIPTION_EXPIRED]:           SubscriptionExpiredPayload;
    [DomainEventType.SUBSCRIPTION_ASSIGNED]:          SubscriptionAssignedPayload;
    [DomainEventType.SUBSCRIPTION_PAYMENT_CAPTURED]:  SubscriptionPaymentCapturedPayload;
    [DomainEventType.SUBSCRIPTION_RENEWED]:           SubscriptionRenewedPayload;
    [DomainEventType.SUBSCRIPTION_CANCELLED]:         SubscriptionCancelledPayload;
    [DomainEventType.EMPLOYER_SETUP_COMPLETE]:        EmployerSetupCompletePayload;
};

export interface DomainEvent<T extends DomainEventType = DomainEventType> {
    eventId: string;           // UUID — for idempotency
    type: T;
    payload: DomainEventPayloadMap[T];
    occurredAt: string;        // ISO timestamp
    sourceService: string;     // e.g. 'seeker-service', 'admin-app'
    version: number;           // schema version, currently 1
}
