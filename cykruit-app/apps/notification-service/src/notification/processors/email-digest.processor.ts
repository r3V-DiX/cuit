// apps/notification-service/src/notification/processors/email-digest.processor.ts

import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { AppLogger } from '@cykruit/logger';
import { MailService } from '@cykruit/mail';
import { EmailFrequency } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';
import { NOTIFICATION_QUEUE } from '../constants';
import { NOTIFICATION_JOBS } from '../services/notification.service';

interface SendEmailJobData {
    notificationId: string;
    email: string;
    title: string;
    message: string;
    actionUrl?: string;
    firstName?: string;
}

@Processor(NOTIFICATION_QUEUE)
export class EmailDigestProcessor {
    constructor(
        private readonly mailService: MailService,
        private readonly notificationRepository: NotificationRepository,
        private readonly logger: AppLogger,
    ) {}

    // ── Instant email ─────────────────────────────────────────────────────────

    @Process(NOTIFICATION_JOBS.SEND_EMAIL)
    async handleSendEmail(job: Job<SendEmailJobData>): Promise<void> {
        const { email, message, actionUrl, firstName } = job.data;

        try {
            await this.mailService.sendNotificationEmail(email, message, actionUrl, firstName);
            this.logger.log(
                `Notification email sent to ${email} (job ${job.id})`,
                'EmailDigestProcessor',
            );
        } catch (err) {
            this.logger.error(
                `Failed to send notification email to ${email} (job ${job.id})`,
                err,
                'EmailDigestProcessor',
            );
            throw err; // Rethrow so Bull retries
        }
    }

    // ── Daily digest ──────────────────────────────────────────────────────────

    @Process(NOTIFICATION_JOBS.DAILY_DIGEST)
    async handleDailyDigest(job: Job): Promise<void> {
        this.logger.log(`Daily digest job ${job.id} started`, 'EmailDigestProcessor');

        const since = new Date();
        since.setHours(since.getHours() - 24);

        try {
            const users = await this.notificationRepository.findUsersForDigest(EmailFrequency.DAILY);

            let sent = 0;
            for (const user of users) {
                try {
                    const notifications = await this.notificationRepository.findUnreadSince(
                        user.userId,
                        since,
                    );

                    if (!notifications.length) continue;

                    const summary = notifications
                        .slice(0, 5) // cap digest to 5 items
                        .map((n) => `• ${n.title}: ${n.message}`)
                        .join('\n');

                    const message =
                        notifications.length > 5
                            ? `${summary}\n\n…and ${notifications.length - 5} more notifications.`
                            : summary;

                    await this.mailService.sendNotificationEmail(
                        user.email,
                        message,
                        undefined,
                        user.firstName,
                    );

                    sent++;
                } catch (err) {
                    // Skip this user — don't fail the whole digest batch
                    this.logger.error(
                        `Daily digest failed for user ${user.userId}`,
                        err,
                        'EmailDigestProcessor',
                    );
                }
            }

            this.logger.log(
                `Daily digest job ${job.id} complete — sent to ${sent}/${users.length} users`,
                'EmailDigestProcessor',
            );
        } catch (err) {
            this.logger.error(`Daily digest job ${job.id} failed`, err, 'EmailDigestProcessor');
            throw err;
        }
    }
}
