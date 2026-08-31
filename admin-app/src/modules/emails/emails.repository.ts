// admin-app/src/modules/emails/emails.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { EmailCampaignStatus, EmailRecipientType, Prisma, UserRole } from '@prisma/client';
import { CampaignListQueryDto } from './dto/emails.dto';

@Injectable()
export class EmailsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findCampaigns(query: CampaignListQueryDto) {
        const { page = 1, limit = 20, status, search } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AdminEmailCampaignWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { segmentTarget: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.adminEmailCampaign.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    creator: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: {
                            recipientLogs: true,
                        },
                    },
                },
            }),
            this.prisma.adminEmailCampaign.count({ where }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findCampaignById(id: string) {
        return this.prisma.adminEmailCampaign.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                recipientLogs: {
                    take: 100,
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        recipientLogs: true,
                    },
                },
            },
        });
    }

    async createCampaign(data: {
        subject: string;
        bodyHtml: string;
        recipientType: EmailRecipientType;
        segmentTarget?: string;
        totalRecipients: number;
        createdById: string;
        status?: EmailCampaignStatus;
    }) {
        return this.prisma.adminEmailCampaign.create({
            data: {
                subject: data.subject,
                bodyHtml: data.bodyHtml,
                recipientType: data.recipientType,
                segmentTarget: data.segmentTarget,
                totalRecipients: data.totalRecipients,
                createdById: data.createdById,
                status: data.status ?? EmailCampaignStatus.QUEUED,
            },
        });
    }

    async updateCampaignStatus(
        id: string,
        data: {
            status: EmailCampaignStatus;
            sentCount?: number;
            failedCount?: number;
            errorMessage?: string | null;
            completedAt?: Date | null;
        },
    ) {
        return this.prisma.adminEmailCampaign.update({
            where: { id },
            data,
        });
    }

    async recordRecipientLog(data: {
        campaignId: string;
        email: string;
        name?: string | null;
        status: 'SENT' | 'FAILED';
        error?: string | null;
        sentAt?: Date | null;
    }) {
        return this.prisma.adminEmailRecipientLog.create({
            data: {
                campaignId: data.campaignId,
                email: data.email,
                name: data.name,
                status: data.status,
                error: data.error,
                sentAt: data.sentAt,
            },
        });
    }

    async findUsersBySegment(segment: string): Promise<Array<{ email: string; firstName: string; lastName: string }>> {
        const normalized = segment.toUpperCase();
        const where: Prisma.UserWhereInput = {
            isEmailVerified: true,
        };

        if (normalized === 'SEEKERS' || normalized === 'SEEKER') {
            where.role = UserRole.SEEKER;
            where.status = 'ACTIVE';
        } else if (normalized === 'EMPLOYERS' || normalized === 'EMPLOYER') {
            where.role = UserRole.EMPLOYER;
            where.status = 'ACTIVE';
        } else if (normalized === 'ACTIVE') {
            where.status = 'ACTIVE';
        } else {
            // "ALL" or default -> verified and not deleted
            where.status = { not: 'DELETED' };
        }

        return this.prisma.user.findMany({
            where,
            select: {
                email: true,
                firstName: true,
                lastName: true,
            },
        });
    }
}
