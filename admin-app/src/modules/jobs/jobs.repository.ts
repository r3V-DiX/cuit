// admin-app/src/admin/repositories/jobs.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { JobStatus, Prisma } from '@prisma/client';
import { ACTIONS, Searchable, type ISearchEntity, type SearchResultItem } from '../../common';
import { AdminJobListQueryDto } from './dto/jobs.dto';

@Searchable()
@Injectable()
export class AdminJobsRepository implements ISearchEntity {
    readonly key = 'jobs';
    readonly label = 'Jobs';
    readonly action = ACTIONS.JOBS.VIEW;

    constructor(private readonly prisma: PrismaService) {}

    async search(q: string, take: number): Promise<SearchResultItem[]> {
        const rows = await this.prisma.job.findMany({
            where: {
                OR: [
                    { jobTitle: { contains: q, mode: Prisma.QueryMode.insensitive } },
                    { employer: { companyName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                ],
            },
            select: { id: true, jobTitle: true, employer: { select: { companyName: true } } },
            take,
        });
        return rows.map((j) => ({
            id: j.id,
            title: j.jobTitle,
            subtitle: j.employer?.companyName ?? null,
            href: `/jobs/${j.id}`,
        }));
    }

    async findAll(query: AdminJobListQueryDto): Promise<{ items: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 20, status, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.JobWhereInput = {
            ...(status ? { status } : {}),
            ...(q
                ? {
                      OR: [
                          { jobTitle: { contains: q, mode: Prisma.QueryMode.insensitive } },
                          { employer: { companyName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                      ],
                  }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    employer: {
                        select: {
                            id: true,
                            companyName: true,
                            slug: true,
                            companyLogo: true,
                            isVerified: true,
                        },
                    },
                    role: true,
                    location: true,
                },
            }),
            this.prisma.job.count({ where }),
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
        return this.prisma.job.findUnique({
            where: { id },
            include: {
                employer: {
                    select: {
                        id: true,
                        companyName: true,
                        slug: true,
                        companyLogo: true,
                        isVerified: true,
                    },
                },
                role: true,
                location: true,
                skills: { include: { skill: true } },
                // screeningQuestions is a JSON field — returned automatically, no include needed
            },
        });
    }

    async approve(id: string) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            select: { publishedAt: true, employerId: true },
        });

        const sub = job
            ? await this.prisma.employerSubscription.findUnique({
                  where: { employerId: job.employerId },
                  select: {
                      status: true,
                      expiresAt: true,
                      package: { select: { jobPostingPeriodDays: true } },
                  },
              })
            : null;

        const now = new Date();
        // Use resolveEffectiveStatus logic inline: treat sub as inactive if expiresAt has passed
        const isActive =
            sub &&
            sub.status === 'ACTIVE' &&
            (sub.expiresAt === null || sub.expiresAt > now);
        const periodDays = (isActive ? sub?.package?.jobPostingPeriodDays : null) ?? 30;

        // Always compute expiresAt from now — if this is a re-approval, using the
        // original publishedAt would produce a past expiry date.
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + periodDays);

        return this.prisma.job.update({
            where: { id },
            data: {
                status: JobStatus.APPROVED,
                ...(job?.publishedAt ? {} : { publishedAt: now }),
                expiresAt,
            },
        });
    }

    async reject(id: string, reason: string) {
        return this.prisma.job.update({
            where: { id },
            data: { status: JobStatus.REJECTED, rejectionReason: reason },
        });
    }

    async setFeatured(id: string, isFeatured: boolean) {
        return this.prisma.job.update({
            where: { id },
            data: { isFeatured },
            select: { id: true, jobTitle: true, isFeatured: true, status: true },
        });
    }
}
