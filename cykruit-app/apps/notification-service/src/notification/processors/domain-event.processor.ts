// apps/notification-service/src/notification/processors/domain-event.processor.ts

import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { AppLogger } from '@cykruit/logger';
import { PrismaService } from '@cykruit/prisma';
import {
    DOMAIN_EVENTS_QUEUE,
    DOMAIN_EVENT_JOB,
    DomainEvent,
    DomainEventType,
} from '@cykruit/events';
import { NotificationType, DeliveryChannel } from '@prisma/client';
import { NotificationService } from '../services/notification.service';

@Processor(DOMAIN_EVENTS_QUEUE)
export class DomainEventProcessor {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly prisma: PrismaService,
        private readonly logger: AppLogger,
    ) {}

    @Process(DOMAIN_EVENT_JOB)
    async handle(job: Job<DomainEvent>): Promise<void> {
        const event = job.data;
        this.logger.log(
            `[DomainEventProcessor] Processing ${event.type} (${event.eventId}) from ${event.sourceService}`,
            'DomainEventProcessor',
        );

        try {
            await this.route(event);
        } catch (err) {
            this.logger.error(
                `[DomainEventProcessor] Failed to process ${event.type} (${event.eventId})`,
                err,
                'DomainEventProcessor',
            );
            throw err; // Rethrow — Bull will retry
        }
    }

    /** Fetch email + firstName for a userId. Returns nulls if user not found. */
    private async userContact(userId: string): Promise<{ email: string; firstName: string } | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, firstName: true },
        });
        return user ? { email: user.email, firstName: user.firstName } : null;
    }

    private async route(event: DomainEvent): Promise<void> {
        switch (event.type) {

            // ── Application events ────────────────────────────────────────────

            case DomainEventType.APPLICATION_SUBMITTED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.NEW_APPLICANT,
                    title: 'New Application Received',
                    message: `${p.seekerName} applied for "${p.jobTitle}"`,
                    actionUrl: `/employer/applicants/${p.applicationId}`,
                    relatedEntityType: 'Application',
                    relatedEntityId: p.applicationId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.APPLICATION_STATUS_CHANGED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.seekerId);
                await this.notificationService.emit({
                    userId: p.seekerId,
                    type: NotificationType.APPLICATION_STATUS,
                    title: 'Application Update',
                    message: `Your application for "${p.jobTitle}" has been updated to ${p.newStatus.toLowerCase().replace('_', ' ')}`,
                    actionUrl: `/applications/${p.applicationId}`,
                    relatedEntityType: 'Application',
                    relatedEntityId: p.applicationId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.APPLICATION_WITHDRAWN: {
                // Seeker withdrew themselves — no notification needed
                break;
            }

            // ── Job events ────────────────────────────────────────────────────

            case DomainEventType.JOB_APPROVED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.JOB_APPROVAL,
                    title: 'Job Approved',
                    message: `Your job "${p.jobTitle}" has been approved and is now live`,
                    actionUrl: `/employer/jobs/${p.jobId}`,
                    relatedEntityType: 'Job',
                    relatedEntityId: p.jobId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.JOB_REJECTED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.JOB_APPROVAL,
                    title: 'Job Rejected',
                    message: `Your job "${p.jobTitle}" was not approved: ${p.rejectionReason}`,
                    actionUrl: `/employer/jobs/${p.jobId}`,
                    relatedEntityType: 'Job',
                    relatedEntityId: p.jobId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.JOB_EXPIRING_SOON: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.JOB_EXPIRY_ALERT,
                    title: 'Job Expiring Soon',
                    message: `"${p.jobTitle}" expires on ${new Date(p.expiresAt).toLocaleDateString()}. Reopen it to keep receiving applications.`,
                    actionUrl: `/employer/jobs/${p.jobId}`,
                    relatedEntityType: 'Job',
                    relatedEntityId: p.jobId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            // ── KYC events ────────────────────────────────────────────────────

            case DomainEventType.KYC_APPROVED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.KYC_APPROVED,
                    title: 'Company Verified',
                    message: `${p.companyName} has been verified. You can now post jobs.`,
                    actionUrl: `/employer/company`,
                    relatedEntityType: 'EmployerVerification',
                    relatedEntityId: p.verificationId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.KYC_REJECTED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.KYC_REJECTED,
                    title: 'Verification Unsuccessful',
                    message: `${p.companyName} verification was rejected: ${p.rejectionReason}`,
                    actionUrl: `/kyc/employer`,
                    relatedEntityType: 'EmployerVerification',
                    relatedEntityId: p.verificationId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            // ── Team events ───────────────────────────────────────────────────

            case DomainEventType.TEAM_INVITE_ACCEPTED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.userId);
                if (!contact) break;
                await this.notificationService.emit({
                    userId: p.userId,
                    type: NotificationType.JOIN_REQUEST_RESOLVED,
                    title: `Welcome to ${p.companyName}!`,
                    message: p.roleUpgraded
                        ? `You've joined ${p.companyName} as ${p.role.toLowerCase()}. Please log in again to access your employer dashboard.`
                        : `You've joined ${p.companyName} as ${p.role.toLowerCase()}.`,
                    actionUrl: p.roleUpgraded ? `/login?reason=role_upgraded` : `/employer/dashboard`,
                    relatedEntityType: 'Employer',
                    relatedEntityId: p.employerId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact.email,
                    firstName: contact.firstName,
                });
                break;
            }

            case DomainEventType.TEAM_INVITE_SENT: {
                const p = event.payload as any;
                if (p.invitedUserId) {
                    await this.notificationService.emit({
                        userId: p.invitedUserId,
                        type: NotificationType.SYSTEM_ANNOUNCEMENT,
                        title: 'Team Invitation',
                        message: `You have been invited to join ${p.companyName} as ${p.role.toLowerCase()}`,
                        actionUrl: `/employer/accept-invite?token=${p.inviteToken}`,
                        relatedEntityType: 'Employer',
                        relatedEntityId: p.employerId,
                        // In-app notification only — employer-service already sends
                        // the authoritative invite email (with the accept link).
                        // Emailing a second "New notification from Cykruit" here
                        // duplicated the invite and carried a broken relative
                        // actionUrl in the email body.
                        deliveredVia: [DeliveryChannel.WEBSOCKET],
                        sendEmail: false,
                    });
                }
                break;
            }

            // ── Account events ────────────────────────────────────────────────

            case DomainEventType.ACCOUNT_SUSPENDED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.userId);
                await this.notificationService.emit({
                    userId: p.userId,
                    type: NotificationType.SYSTEM_ANNOUNCEMENT,
                    title: 'Account Suspended',
                    message: p.reason
                        ? `Your account has been suspended: ${p.reason}`
                        : 'Your account has been suspended. Contact support for assistance.',
                    actionUrl: `/support`,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.ACCOUNT_UNSUSPENDED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.userId);
                await this.notificationService.emit({
                    userId: p.userId,
                    type: NotificationType.SYSTEM_ANNOUNCEMENT,
                    title: 'Account Reinstated',
                    message: 'Your account has been reinstated. Welcome back.',
                    actionUrl: `/dashboard`,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            // ── Subscription events ───────────────────────────────────────────

            case DomainEventType.SUBSCRIPTION_EXPIRED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.PLATFORM_ANNOUNCEMENT,
                    title: 'Subscription Expired',
                    message: `Your ${p.packageName} plan has expired. Contact us to renew.`,
                    actionUrl: `/employer/subscription`,
                    relatedEntityType: 'EmployerSubscription',
                    relatedEntityId: p.subscriptionId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.SUBSCRIPTION_ASSIGNED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.PLATFORM_ANNOUNCEMENT,
                    title: 'Plan Updated',
                    message: `Your account has been assigned the ${p.packageName} plan`,
                    actionUrl: `/employer/subscription`,
                    relatedEntityType: 'EmployerSubscription',
                    relatedEntityId: p.subscriptionId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.SUBSCRIPTION_PAYMENT_CAPTURED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                const amountRupees = p.amountPaise ? `₹${Math.round(p.amountPaise / 100).toLocaleString('en-IN')}` : '';
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.PLATFORM_ANNOUNCEMENT,
                    title: 'Payment Successful',
                    message: `Payment of ${amountRupees} received for your ${p.packageName} plan (${p.billingCycle?.toLowerCase()}).`,
                    actionUrl: `/employer/subscription`,
                    relatedEntityType: 'PaymentOrder',
                    relatedEntityId: p.orderId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                await this.notificationService.queueInvoiceEmail({ orderId: p.orderId });
                break;
            }

            case DomainEventType.SUBSCRIPTION_RENEWED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                const expiry = p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.PLATFORM_ANNOUNCEMENT,
                    title: 'Subscription Renewed',
                    message: `Your ${p.packageName} plan (${p.billingCycle?.toLowerCase()}) has been renewed. Active until ${expiry}.`,
                    actionUrl: `/employer/subscription`,
                    relatedEntityType: 'EmployerSubscription',
                    relatedEntityId: p.subscriptionId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.SUBSCRIPTION_PAYMENT_REFUNDED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                const amountRupees = p.amountPaise ? `₹${Math.round(p.amountPaise / 100).toLocaleString('en-IN')}` : '';
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.PLATFORM_ANNOUNCEMENT,
                    title: 'Payment Refunded',
                    message: `Your payment of ${amountRupees} for the ${p.packageName} plan has been refunded.`,
                    actionUrl: `/employer/subscription`,
                    relatedEntityType: 'PaymentOrder',
                    relatedEntityId: p.orderId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.SUBSCRIPTION_CANCELLED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.PLATFORM_ANNOUNCEMENT,
                    title: 'Subscription Cancelled',
                    message: `Your ${p.packageName} plan has been cancelled. You'll retain access until the end of your billing period.`,
                    actionUrl: `/employer/subscription`,
                    relatedEntityType: 'EmployerSubscription',
                    relatedEntityId: p.subscriptionId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.SUBSCRIPTION_RESUMED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.employerUserId);
                const expiry = p.expiresAt
                    ? new Date(p.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '';
                await this.notificationService.emit({
                    userId: p.employerUserId,
                    type: NotificationType.PLATFORM_ANNOUNCEMENT,
                    title: 'Subscription Resumed',
                    message: `Your ${p.packageName} plan has been resumed${expiry ? ` and stays active until ${expiry}` : ''}.`,
                    actionUrl: `/employer/subscription`,
                    relatedEntityType: 'EmployerSubscription',
                    relatedEntityId: p.subscriptionId,
                    deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                    sendEmail: true,
                    userEmail: contact?.email,
                    firstName: contact?.firstName,
                });
                break;
            }

            case DomainEventType.JOIN_REQUEST_RESOLVED: {
                const p = event.payload as any;
                const contact = await this.userContact(p.requesterUserId);
                if (!contact) break;
                if (p.status === 'ACCEPTED') {
                    await this.notificationService.emit({
                        userId: p.requesterUserId,
                        type: NotificationType.JOIN_REQUEST_RESOLVED,
                        title: 'Join request approved',
                        message: `You've been added to ${p.companyName} as a team member. Please log in again to access your employer dashboard.`,
                        actionUrl: `/login?reason=role_upgraded`,
                        relatedEntityType: 'Employer',
                        relatedEntityId: p.employerId,
                        deliveredVia: [DeliveryChannel.WEBSOCKET, DeliveryChannel.EMAIL],
                        sendEmail: true,
                        userEmail: contact.email,
                        firstName: contact.firstName,
                    });
                } else {
                    await this.notificationService.emit({
                        userId: p.requesterUserId,
                        type: NotificationType.JOIN_REQUEST_RESOLVED,
                        title: 'Join request declined',
                        message: `Your request to join ${p.companyName} was not approved. You can continue using Cykruit as a job seeker.`,
                        actionUrl: `/jobs`,
                        relatedEntityType: 'Employer',
                        relatedEntityId: p.employerId,
                        deliveredVia: [DeliveryChannel.WEBSOCKET],
                        sendEmail: false,
                    });
                }
                break;
            }

            default:
                this.logger.warn(
                    `[DomainEventProcessor] Unhandled event type: ${(event as any).type}`,
                    'DomainEventProcessor',
                );
        }
    }
}
