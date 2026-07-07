// admin-app/src/admin/repositories/jobs.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { JobStatus, Prisma } from '@prisma/client';
import { AdminJobListQueryDto } from '../dto/jobs.dto';

@Injectable()
export class AdminJobsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AdminJobListQueryDto): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 20, status, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.JobWhereInput = {
            ...(status ? { status } : { status: JobStatus.PENDING }),
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

        return { items, total };
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
        // Only set publishedAt on first approval (null = never published before)
        const job = await this.prisma.job.findUnique({ where: { id }, select: { publishedAt: true } });
        return this.prisma.job.update({
            where: { id },
            data: {
                status: JobStatus.APPROVED,
                ...(job?.publishedAt ? {} : { publishedAt: new Date() }),
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
