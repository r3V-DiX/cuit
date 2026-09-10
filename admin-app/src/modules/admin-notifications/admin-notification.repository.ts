// admin-app/src/modules/admin-notifications/admin-notification.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';

export interface CreateAdminNotificationRow {
    adminId: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AdminNotificationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findForAdmin(adminId: string, { unreadOnly, page = 1, limit = 20 }: { unreadOnly?: boolean; page?: number; limit?: number }) {
        const skip = (page - 1) * limit;
        const where: Prisma.AdminNotificationWhereInput = {
            adminId,
            ...(unreadOnly ? { isRead: false } : {}),
        };

        const [items, total, unreadCount] = await this.prisma.$transaction([
            this.prisma.adminNotification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.adminNotification.count({ where }),
            this.prisma.adminNotification.count({ where: { adminId, isRead: false } }),
        ]);

        return {
            items,
            unreadCount,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    /** Scoped to adminId so one admin can't mark another admin's notification read. */
    async markRead(id: string, adminId: string) {
        const result = await this.prisma.adminNotification.updateMany({
            where: { id, adminId },
            data: { isRead: true, readAt: new Date() },
        });
        return result.count > 0;
    }

    async createMany(rows: CreateAdminNotificationRow[]) {
        if (rows.length === 0) return;
        await this.prisma.adminNotification.createMany({ data: rows });
    }

    async findActiveAdmins(excludeAdminId?: string) {
        return this.prisma.admin.findMany({
            where: {
                isActive: true,
                ...(excludeAdminId ? { id: { not: excludeAdminId } } : {}),
            },
            select: { id: true, email: true, firstName: true },
        });
    }
}
