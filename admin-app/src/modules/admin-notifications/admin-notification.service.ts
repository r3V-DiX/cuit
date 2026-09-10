// admin-app/src/modules/admin-notifications/admin-notification.service.ts

import { Injectable } from '@nestjs/common';
import { MailService } from '@cykruit/mail';
import { AppLogger } from '@cykruit/logger';
import { AdminNotificationRepository } from './admin-notification.repository';
import { ListAdminNotificationsDto } from './dto/admin-notification.dto';

export interface NotifyAllAdminsInput {
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    /** Skip notifying the admin who performed the action themselves. */
    excludeAdminId?: string;
}

@Injectable()
export class AdminNotificationService {
    constructor(
        private readonly repository: AdminNotificationRepository,
        private readonly mailService: MailService,
        private readonly logger: AppLogger,
    ) {}

    async list(adminId: string, query: ListAdminNotificationsDto) {
        return this.repository.findForAdmin(adminId, query);
    }

    async markRead(id: string, adminId: string) {
        return this.repository.markRead(id, adminId);
    }

    /**
     * General-purpose fan-out to every active admin (minus the actor, if given).
     * Fire-and-forget by design — callers should call this with `.catch(...)`
     * (or `void`) so a notification failure never breaks the action that
     * triggered it. Creates one in-app row per admin plus one email each.
     */
    async notifyAllAdmins(input: NotifyAllAdminsInput): Promise<void> {
        const admins = await this.repository.findActiveAdmins(input.excludeAdminId);
        if (admins.length === 0) return;

        await this.repository.createMany(
            admins.map((admin) => ({
                adminId: admin.id,
                type: input.type,
                title: input.title,
                message: input.message,
                actionUrl: input.actionUrl,
                relatedEntityType: input.relatedEntityType,
                relatedEntityId: input.relatedEntityId,
            })),
        );

        await Promise.all(
            admins.map((admin) =>
                this.mailService
                    .sendAdminNotificationEmail(admin.email, input.title, input.message, input.actionUrl, admin.firstName)
                    .catch((err: unknown) => {
                        this.logger.warn(
                            `Failed to send admin notification email to ${admin.email}: ${String(err)}`,
                            'AdminNotificationService',
                        );
                    }),
            ),
        );
    }
}
