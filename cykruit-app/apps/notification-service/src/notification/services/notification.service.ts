// apps/notification-service/src/notification/services/notification.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { NOTIFICATION_QUEUE } from '../constants';
import { NotificationRepository, CreateNotificationInput } from '../repositories/notification.repository';
import { NotificationListQueryDto } from '../dto/notification-query.dto';

/** Job names inside the notification-email Bull queue */
export const NOTIFICATION_JOBS = {
    SEND_EMAIL: 'send-email',
    DAILY_DIGEST: 'daily-digest',
} as const;

@Injectable()
export class NotificationService {
    constructor(
        private readonly notificationRepository: NotificationRepository,
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

    // ── Emit (called by other services internally / future event bus) ─────────

    /**
     * Create an in-app notification and optionally queue an email.
     * Fire-and-forget safe — wrap callers with .catch() so email failures don't
     * bubble up to the user-facing apply/KYC/job flows.
     */
    async emit(input: CreateNotificationInput & { sendEmail?: boolean; userEmail?: string; firstName?: string }) {
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
                // Email queue failure must never fail the notification creation
                console.warn('[NotificationService] Failed to queue email:', err?.message);
            });
        }

        return notification;
    }

    /** Enqueue a daily digest job for all eligible users. Called by cron or scheduler. */
    async enqueueDailyDigest() {
        await this.emailQueue.add(
            NOTIFICATION_JOBS.DAILY_DIGEST,
            {},
            {
                attempts: 1,
                removeOnComplete: true,
                // Delay by 5s to let any last-minute notifications be persisted
                delay: 5000,
            },
        );
        return { message: 'Daily digest job enqueued' };
    }
}
