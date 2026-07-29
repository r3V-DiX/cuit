// apps/notification-service/src/notification/services/notification.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { NOTIFICATION_QUEUE } from '../constants';
import { NotificationRepository, CreateNotificationInput } from '../repositories/notification.repository';
import { NotificationListQueryDto } from '../dto/notification-query.dto';
import { PrismaService } from '@cykruit/prisma';
import { NotificationType, type NotificationPreference } from '@prisma/client';

/** Job names inside the notification-email Bull queue */
export const NOTIFICATION_JOBS = {
    SEND_EMAIL: 'send-email',
    DAILY_DIGEST: 'daily-digest',
} as const;

// Notification types that always deliver regardless of preferences
// (account security, admin-initiated actions the user must know about)
const BYPASS_PREFS: Set<NotificationType> = new Set([
    NotificationType.SYSTEM_ANNOUNCEMENT,
]);

type PrefKey = keyof Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

// Maps a NotificationType to the preference field names that gate it.
// If a type has no entry it falls through to the global enableInApp / enableEmail toggles only.
const PREF_MAP: Partial<Record<NotificationType, { inApp: PrefKey; email: PrefKey }>> = {
    [NotificationType.APPLICATION_SUBMITTED]:  { inApp: 'applicationSubmitted_inApp', email: 'applicationSubmitted_email' },
    [NotificationType.APPLICATION_STATUS]:     { inApp: 'applicationStatus_inApp',    email: 'applicationStatus_email'    },
    [NotificationType.JOB_REJECTION]:          { inApp: 'jobRejection_inApp',         email: 'jobRejection_email'         },
    [NotificationType.INTERVIEW_SCHEDULED]:    { inApp: 'interviewScheduled_inApp',   email: 'interviewScheduled_email'   },
    [NotificationType.JOB_ALERT]:              { inApp: 'jobAlert_inApp',             email: 'jobAlert_email'             },
    [NotificationType.NEW_APPLICANT]:          { inApp: 'newApplicant_inApp',         email: 'newApplicant_email'         },
    [NotificationType.APPLICATION_UPDATE]:     { inApp: 'applicationUpdate_inApp',    email: 'applicationUpdate_email'    },
    [NotificationType.GROUPED_APPLICANTS]:     { inApp: 'groupedApplicants_inApp',    email: 'groupedApplicants_email'    },
    [NotificationType.JOB_EXPIRY_ALERT]:       { inApp: 'jobExpiryAlert_inApp',       email: 'jobExpiryAlert_email'       },
    [NotificationType.JOB_APPROVAL]:           { inApp: 'jobApproval_inApp',          email: 'jobApproval_email'          },
    [NotificationType.KYC_APPROVED]:           { inApp: 'kycApproved_inApp',          email: 'kycApproved_email'          },
    [NotificationType.KYC_REJECTED]:           { inApp: 'kycRejected_inApp',          email: 'kycRejected_email'          },
    [NotificationType.PLATFORM_ANNOUNCEMENT]:  { inApp: 'platformAnnouncement_inApp', email: 'platformAnnouncement_email' },
};

@Injectable()
export class NotificationService {
    constructor(
        private readonly notificationRepository: NotificationRepository,
        private readonly prisma: PrismaService,
        @InjectQueue(NOTIFICATION_QUEUE) private readonly emailQueue: Queue,
    ) {}

    // ── CRUD ──────────────────────────────────────────────────────────────────

    async list(userId: string, query: NotificationListQueryDto) {
        const { items, total } = await this.notificationRepository.findByUser(userId, query);

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getUnreadCount(userId: string) {
        const count = await this.notificationRepository.countUnread(userId);
        return { count };
    }

    async markRead(userId: string, notificationId: string) {
        const notification = await this.notificationRepository.findByIdAndUser(
            notificationId,
            userId,
        );
        if (!notification) throw new NotFoundException('NOTIFICATION_NOT_FOUND');

        await this.notificationRepository.markRead(notificationId, userId);
        return { message: 'Notification marked as read' };
    }

    async markAllRead(userId: string) {
        await this.notificationRepository.markAllRead(userId);
        return { message: 'All notifications marked as read' };
    }

    async deleteOne(userId: string, notificationId: string) {
        const notification = await this.notificationRepository.findByIdAndUser(
            notificationId,
            userId,
        );
        if (!notification) throw new NotFoundException('NOTIFICATION_NOT_FOUND');

        await this.notificationRepository.deleteOne(notificationId, userId);
        return { message: 'Notification deleted' };
    }

    // ── Emit ──────────────────────────────────────────────────────────────────

    /**
     * Create an in-app notification and optionally queue an email,
     * honouring the user's NotificationPreference settings.
     *
     * Bypass types (SYSTEM_ANNOUNCEMENT) always deliver regardless of preferences.
     * Fire-and-forget safe — wrap callers with .catch() so failures don't
     * bubble up to user-facing flows.
     */
    async emit(input: CreateNotificationInput & { sendEmail?: boolean; userEmail?: string; firstName?: string }) {
        // System messages always deliver — skip preference check
        if (BYPASS_PREFS.has(input.type)) {
            return this.createAndEmail(input);
        }

        // Load preferences (null = no row yet → treat as all defaults = enabled)
        const prefs = await this.prisma.notificationPreference.findUnique({
            where: { userId: input.userId },
        });

        const shouldInApp = this.checkInApp(prefs, input.type);
        if (!shouldInApp) return null; // Suppressed by user preference

        const shouldEmail = input.sendEmail && this.checkEmail(prefs, input.type);
        return this.createAndEmail({ ...input, sendEmail: shouldEmail });
    }

    /** Enqueue a daily digest job for all eligible users. Called by cron or scheduler. */
    async enqueueDailyDigest() {
        await this.emailQueue.add(
            NOTIFICATION_JOBS.DAILY_DIGEST,
            {},
            {
                attempts: 1,
                removeOnComplete: true,
                delay: 5000,
            },
        );
        return { message: 'Daily digest job enqueued' };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private checkInApp(prefs: NotificationPreference | null, type: NotificationType): boolean {
        if (prefs && !prefs.enableInApp) return false;
        const keys = PREF_MAP[type];
        if (!keys || !prefs) return true; // No specific pref or no row → default on
        return prefs[keys.inApp] as boolean;
    }

    private checkEmail(prefs: NotificationPreference | null, type: NotificationType): boolean {
        if (prefs && !prefs.enableEmail) return false;
        const keys = PREF_MAP[type];
        if (!keys || !prefs) return true;
        return prefs[keys.email] as boolean;
    }

    private async createAndEmail(
        input: CreateNotificationInput & { sendEmail?: boolean; userEmail?: string; firstName?: string },
    ) {
        const notification = await this.notificationRepository.create(input);

        if (input.sendEmail && input.userEmail) {
            await this.emailQueue.add(
                NOTIFICATION_JOBS.SEND_EMAIL,
                {
                    notificationId: notification.id,
                    email: input.userEmail,
                    title: input.title,
                    message: input.message,
                    actionUrl: input.actionUrl,
                    firstName: input.firstName,
                },
                { delay: 0, attempts: 3, removeOnComplete: true },
            ).catch((err) => {
                console.warn('[NotificationService] Failed to queue email:', err?.message);
            });
        }

        return notification;
    }
}
