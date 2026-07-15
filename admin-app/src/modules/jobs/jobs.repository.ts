// admin-app/src/admin/repositories/jobs.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { JobStatus, Prisma } from '@prisma/client';
import { AdminJobListQueryDto } from './dto/jobs.dto';

@Injectable()
export class AdminJobsRepository {
    constructor(private readonly prisma: PrismaService) {}

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
        const isActive =
            sub &&
            sub.status === 'ACTIVE' &&
            (sub.expiresAt === null || sub.expiresAt > now);
        const periodDays = (isActive ? sub?.package?.jobPostingPeriodDays : null) ?? 30;

        const publishedAt = job?.publishedAt ?? now;
        const expiresAt = new Date(publishedAt);
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
}
