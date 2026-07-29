// apps/employer-service/src/employer/repositories/jobs.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { ApplicationStatus, JobStatus, Prisma } from '@prisma/client';
import { JobListQueryDto } from '../dto/job.dto';

const JOB_DETAIL_INCLUDE = {
    skills: { include: { skill: true } },
    certifications: { include: { certification: true } },
    role: true,
    location: true,
    employer: {
        select: {
            id: true,
            companyName: true,
            companyLogo: true,
            about: true,
            industry: true,
            companySize: true,
        },
    },
    _count: { select: { applications: true } },
} satisfies Prisma.JobInclude;

@Injectable()
export class JobsRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ── Queries ───────────────────────────────────────────────────────────────

    async findByEmployer(
        employerId: string,
        query: JobListQueryDto,
    ): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 10, status, search } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.JobWhereInput = {
            employerId,
            ...(status ? { status } : {}),
            ...(search
                ? {
                      jobTitle: {
                          contains: search,
                          mode: Prisma.QueryMode.insensitive,
                      },
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
                    role: true,
                    location: true,
                    _count: {
                        select: { applications: true },
                    },
                },
            }),
            this.prisma.job.count({ where }),
        ]);

        return { items, total };
    }

    async findById(id: string) {
        return this.prisma.job.findUnique({
            where: { id },
            include: JOB_DETAIL_INCLUDE,
        });
    }

    async findByIdAndEmployer(id: string, employerId: string) {
        return this.prisma.job.findFirst({
            where: { id, employerId },
            include: JOB_DETAIL_INCLUDE,
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.job.findUnique({ where: { slug } });
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    async create(data: Prisma.JobCreateInput) {
        return this.prisma.job.create({
            data,
            include: JOB_DETAIL_INCLUDE,
        });
    }

    async update(id: string, data: Prisma.JobUpdateInput) {
        return this.prisma.job.update({
            where: { id },
            data,
            include: JOB_DETAIL_INCLUDE,
        });
    }

    async updateStatus(id: string, status: JobStatus, extra?: Prisma.JobUpdateInput) {
        return this.prisma.job.update({
            where: { id },
            data: { status, ...(extra ?? {}) },
            include: JOB_DETAIL_INCLUDE,
        });
    }

    /**
     * Count APPROVED + PENDING jobs for an employer.
     * Used to enforce subscription.maxActiveJobs limit.
     */
    async countActive(employerId: string): Promise<number> {
        return this.prisma.job.count({
            where: {
                employerId,
                status: { in: [JobStatus.APPROVED, JobStatus.PENDING] },
            },
        });
    }

    async close(id: string, reason: string) {
        return this.prisma.$transaction(async (tx) => {
            const job = await tx.job.update({
                where: { id },
                data: {
                    status: JobStatus.CLOSED,
                    closedReason: reason,
                    closedAt: new Date(),
                },
                include: JOB_DETAIL_INCLUDE,
            });

            // Withdraw all open applications so seekers are notified of closure
            await tx.application.updateMany({
                where: {
                    jobId: id,
                    status: { in: [ApplicationStatus.APPLIED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SHORTLISTED] },
                },
                data: { status: ApplicationStatus.WITHDRAWN },
            });

            return job;
        });
    }

    /** Hard delete — caller must verify job is in DRAFT status first. */
    async delete(id: string): Promise<void> {
        await this.prisma.job.delete({ where: { id } });
    }
}
