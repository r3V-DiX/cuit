// admin-app/src/modules/applications/applications.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { ACTIONS, Searchable, type ISearchEntity, type SearchResultItem } from '../../common';
import { AdminApplicationListQueryDto } from './dto/applications.dto';

const APPLICATION_LIST_SELECT = {
    id: true,
    status: true,
    aiScore: true,
    appliedAt: true,
    job: {
        select: {
            id: true,
            jobTitle: true,
            employer: { select: { id: true, companyName: true } },
        },
    },
    jobSeeker: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.ApplicationSelect;

type ApplicationListItem = Prisma.ApplicationGetPayload<{ select: typeof APPLICATION_LIST_SELECT }>;

@Searchable()
@Injectable()
export class ApplicationsRepository implements ISearchEntity {
    readonly key = 'applications';
    readonly label = 'Applications';
    readonly action = ACTIONS.APPLICATIONS.VIEW;

    constructor(private readonly prisma: PrismaService) {}

    async search(q: string, take: number): Promise<SearchResultItem[]> {
        const rows = await this.prisma.application.findMany({
            where: {
                OR: [
                    { job: { jobTitle: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                    { jobSeeker: { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                    { jobSeeker: { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                    { jobSeeker: { email: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                ],
            },
            select: {
                id: true,
                job: { select: { jobTitle: true } },
                jobSeeker: { select: { firstName: true, lastName: true } },
            },
            take,
        });
        return rows.map((a) => ({
            id: a.id,
            title: `${a.jobSeeker.firstName} ${a.jobSeeker.lastName}`.trim(),
            subtitle: a.job.jobTitle,
            href: `/applications/${a.id}`,
        }));
    }

    async findAll(query: AdminApplicationListQueryDto): Promise<{ items: ApplicationListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 20, status, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ApplicationWhereInput = {
            ...(status ? { status } : {}),
            ...(q
                ? {
                      OR: [
                          { job: { jobTitle: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                          { job: { employer: { companyName: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
                          { jobSeeker: { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                          { jobSeeker: { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                          { jobSeeker: { email: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                      ],
                  }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.application.findMany({
                where,
                skip,
                take: limit,
                orderBy: { appliedAt: 'desc' },
                select: APPLICATION_LIST_SELECT,
            }),
            this.prisma.application.count({ where }),
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

    async findById(id: string) {
        return this.prisma.application.findUnique({
            where: { id },
            include: {
                job: {
                    select: { id: true, jobTitle: true, employer: { select: { id: true, companyName: true } } },
                },
                jobSeeker: { select: { id: true, firstName: true, lastName: true, email: true } },
                resume: { select: { id: true, fileName: true } },
                statusHistory: { orderBy: { changedAt: 'desc' } },
                notes: { orderBy: { createdAt: 'desc' } },
            },
        });
    }
}
