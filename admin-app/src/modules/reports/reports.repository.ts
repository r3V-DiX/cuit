// admin-app/src/admin/repositories/reports.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { FlagStatus, FlaggedContentType, Prisma } from '@prisma/client';
import { ACTIONS, Searchable, type ISearchEntity, type SearchResultItem } from '../../common';
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

@Searchable()
@Injectable()
export class ReportsRepository implements ISearchEntity {
    readonly key = 'reports';
    readonly label = 'Content Reports';
    readonly action = ACTIONS.REPORTS.VIEW;

    constructor(private readonly prisma: PrismaService) {}

    async search(q: string, take: number): Promise<SearchResultItem[]> {
        const rows = await this.prisma.contentReport.findMany({
            where: { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
            select: { id: true, contentType: true, reason: true, description: true },
            take,
        });
        return rows.map((r) => ({
            id: r.id,
            title: `${r.contentType} — ${r.reason}`,
            subtitle: r.description,
            href: `/reports`,
        }));
    }

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
