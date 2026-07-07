// apps/seeker-service/src/seeker/repositories/jobs.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma, JobStatus, ApplicationType } from '@prisma/client';
import { JobSearchDto } from '../dto/job-search.dto';

const JOB_LIST_INCLUDE = {
    employer: {
        select: {
            id: true,
            companyName: true,
            slug: true,
            companyLogo: true,
            industry: true,
            isVerified: true,
        },
    },
    role: true,
    location: true,
    skills: { include: { skill: { select: { id: true, name: true } } } },
    _count: { select: { applications: true } },
} satisfies Prisma.JobInclude;

const JOB_DETAIL_INCLUDE = {
    employer: {
        select: {
            id: true,
            companyName: true,
            slug: true,
            companyLogo: true,
            companyBanner: true,
            industry: true,
            companySize: true,
            about: true,
            companyWebsite: true,
            isVerified: true,
            officeLocations: { take: 3 },
        },
    },
    role: true,
    location: true,
    skills: { include: { skill: true } },
    certifications: { include: { certification: true } },
    _count: { select: { applications: true } },
} satisfies Prisma.JobInclude;

@Injectable()
export class JobsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async search(
        query: JobSearchDto,
        seekerId?: string,
    ): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 10, q, jobType, workMode, experienceLevel, locationId, skillId, featuredOnly } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.JobWhereInput = {
            status: JobStatus.APPROVED,
            AND: [
                // Expiry check — always applied
                { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
                // Text search — only when q is provided
                ...(q
                    ? [{
                          OR: [
                              { jobTitle: { contains: q, mode: Prisma.QueryMode.insensitive } },
                              { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
                              { employer: { companyName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                          ],
                      }]
                    : []),
            ],
            ...(jobType ? { jobType } : {}),
            ...(workMode ? { workMode } : {}),
            ...(experienceLevel ? { experienceLevel } : {}),
            ...(locationId ? { locationId } : {}),
            ...(skillId ? { skills: { some: { skillId } } } : {}),
            // featuredOnly: Job model has no isFeatured field yet — filter is a no-op until schema adds it
        };

        const orderBy: Prisma.JobOrderByWithRelationInput =
            query.sortBy === 'relevance'
                ? { applicationCount: 'desc' }
                : { publishedAt: 'desc' };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: JOB_LIST_INCLUDE,
            }),
            this.prisma.job.count({ where }),
        ]);

        // If seeker logged in, annotate which jobs they've already applied to / saved
        if (seekerId && items.length) {
            const jobIds = items.map((j) => j.id);

            const [applied, saved] = await Promise.all([
                this.prisma.application.findMany({
                    where: { seekerId, jobId: { in: jobIds } },
                    select: { jobId: true, status: true },
                }),
                this.prisma.savedJob.findMany({
                    where: { seekerId, jobId: { in: jobIds } },
                    select: { jobId: true },
                }),
            ]);

            const appliedMap = new Map(applied.map((a) => [a.jobId, a.status]));
            const savedSet = new Set(saved.map((s) => s.jobId));

            return {
                items: items.map((j) => ({
                    ...j,
                    isApplied: appliedMap.has(j.id),
                    applicationStatus: appliedMap.get(j.id) ?? null,
                    isSaved: savedSet.has(j.id),
                })),
                total,
            };
        }

        return { items, total };
    }

    async findBySlug(slug: string, seekerId?: string) {
        const job = await this.prisma.job.findUnique({
            where: { slug },
            include: JOB_DETAIL_INCLUDE,
        });

        if (!job) return null;

        // Track job view (upsert — one view per user per job)
        if (seekerId) {
            await this.prisma.jobView.upsert({
                where: { jobId_viewerId: { jobId: job.id, viewerId: seekerId } },
                create: { jobId: job.id, viewerId: seekerId },
                update: { viewedAt: new Date() },
            }).catch(() => {/* non-critical */});

            const [application, savedJob] = await Promise.all([
                this.prisma.application.findUnique({
                    where: { jobId_seekerId: { jobId: job.id, seekerId } },
                    select: { id: true, status: true },
                }),
                this.prisma.savedJob.findUnique({
                    where: { seekerId_jobId: { seekerId, jobId: job.id } },
                    select: { id: true },
                }),
            ]);

            return {
                ...job,
                isApplied: !!application,
                applicationStatus: application?.status ?? null,
                applicationId: application?.id ?? null,
                isSaved: !!savedJob,
            };
        }

        return job;
    }

    async findById(id: string) {
        return this.prisma.job.findUnique({
            where: { id },
            include: JOB_DETAIL_INCLUDE,
        });
    }

    async incrementViewCount(jobId: string) {
        await this.prisma.job.update({
            where: { id: jobId },
            data: { viewCount: { increment: 1 } },
        }).catch(() => {/* non-critical */});
    }
}
