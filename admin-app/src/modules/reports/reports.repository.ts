// admin-app/src/admin/repositories/reports.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { FlagStatus, FlaggedContentType, Prisma } from '@prisma/client';
import { ReportListQueryDto } from './dto/reports.dto';

const REPORT_SELECT = {
    id: true,
    reporterId: true,
    reporter: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
    },
    contentType: true,
    contentId: true,
    reason: true,
    description: true,
    status: true,
    reviewedBy: true,
    reviewedAt: true,
    adminNotes: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ContentReportSelect;

@Injectable()
export class ReportsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async list(query: ReportListQueryDto) {
        const { page = 1, limit = 20, status, contentType } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ContentReportWhereInput = {
            ...(status ? { status: status as FlagStatus } : {}),
            ...(contentType ? { contentType: contentType as FlaggedContentType } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.contentReport.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: REPORT_SELECT,
            }),
            this.prisma.contentReport.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: string) {
        return this.prisma.contentReport.findUnique({ where: { id }, select: REPORT_SELECT });
    }

    async setStatus(id: string, status: FlagStatus, adminId: string, adminNotes?: string) {
        return this.prisma.contentReport.update({
            where: { id },
            data: {
                status,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                ...(adminNotes !== undefined ? { adminNotes } : {}),
            },
            select: REPORT_SELECT,
        });
    }
}
