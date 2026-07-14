// apps/notification-service/src/notification/repositories/notification.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { EmailFrequency, NotificationStatus, NotificationType, DeliveryChannel, Prisma, type Notification } from '@prisma/client';
import { NotificationListQueryDto } from '../dto/notification-query.dto';

export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    metadata?: Prisma.InputJsonValue;
    deliveredVia?: DeliveryChannel[];
    expiresAt?: Date;
}

@Injectable()
export class NotificationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByUser(
        userId: string,
        query: NotificationListQueryDto,
    ): Promise<{ items: Notification[]; total: number }> {
        const { page = 1, limit = 20, type, unreadOnly } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.NotificationWhereInput = {
            userId,
            ...(type ? { type } : {}),
            ...(unreadOnly ? { isRead: false } : {}),
            // Exclude expired
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.notification.count({ where }),
        ]);

        return { items, total };
    }

    async countUnread(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
        });
    }

    async findByIdAndUser(id: string, userId: string) {
        return this.prisma.notification.findFirst({
            where: { id, userId },
        });
    }

    async markRead(id: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId, isRead: false },
            data: {
                isRead: true,
                readAt: new Date(),
                status: NotificationStatus.READ,
            },
        });
    }

    async markAllRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: {
                isRead: true,
                readAt: new Date(),
                status: NotificationStatus.READ,
            },
        });
    }

    async deleteOne(id: string, userId: string) {
        return this.prisma.notification.deleteMany({
            where: { id, userId },
        });
    }

    async create(data: CreateNotificationInput) {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                actionUrl: data.actionUrl,
                actionText: data.actionText,
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
                metadata: data.metadata,
                deliveredVia: data.deliveredVia ?? [],
                expiresAt: data.expiresAt,
            },
        });
    }

    /** Used by email-digest processor: fetch unread notifications since a timestamp. */
    async findUnreadSince(userId: string, since: Date) {
        return this.prisma.notification.findMany({
            where: {
                userId,
                isRead: false,
                createdAt: { gte: since },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /** Fetch users who have email enabled + a specific frequency. */
    async findUsersForDigest(frequency: EmailFrequency): Promise<Array<{ userId: string; email: string; firstName: string }>> {
        // Joins NotificationPreference → User → JobSeekerProfile for firstName
        const prefs = await this.prisma.notificationPreference.findMany({
            where: {
                enableEmail: true,
                jobAlert_frequency: frequency,
            },
            include: {
                user: {
                    include: {
                        jobSeekerProfile: { select: { firstName: true } },
                    },
                },
            },
        });

        return prefs
            .filter((p) => p.user?.email)
            .map((p) => ({
                userId: p.userId,
                email: p.user.email,
                firstName: p.user?.jobSeekerProfile?.firstName ?? '',
            }));
    }
}
