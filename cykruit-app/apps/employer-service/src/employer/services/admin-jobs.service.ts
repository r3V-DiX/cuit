// apps/employer-service/src/employer/services/admin-jobs.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { JobStatus } from '@prisma/client';
import { AuditService } from '@cykruit/audit';
import { QueueService } from '@cykruit/queue';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { AI_QUEUES, AI_JOB_NAMES } from '@cykruit/ai';
import { AdminJobQueryDto, ApproveJobDto, RejectJobDto } from '../dto/admin-jobs.dto';

@Injectable()
export class AdminJobsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
        private readonly queueService: QueueService,
        @InjectQueue(AI_QUEUES.AI_JOBS) private aiQueue: Queue,
    ) {}

    async listJobs(query: AdminJobQueryDto) {
        const { page = 1, limit = 20, q, status } = query;
        const skip = (page - 1) * limit;

        const where = {
            ...(status ? { status } : {}),
            ...(q
                ? {
                      OR: [
                          { jobTitle: { contains: q, mode: 'insensitive' as const } },
                          { employer: { companyName: { contains: q, mode: 'insensitive' as const } } },
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
                select: {
                    id: true,
                    jobTitle: true,
                    status: true,
                    createdAt: true,
                    rejectionReason: true,
                    employer: {
                        select: {
                            id: true,
                            companyName: true,
                            slug: true,
                            isVerified: true,
                        },
                    },
                },
            }),
            this.prisma.job.count({ where }),
        ]);

        return {
            items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getJob(id: string) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            select: {
                id: true,
                jobTitle: true,
                status: true,
                description: true,
                createdAt: true,
                publishedAt: true,
                expiresAt: true,
                rejectionReason: true,
                employer: {
                    select: {
                        id: true,
                        companyName: true,
                        slug: true,
                        isVerified: true,
                        companyLogo: true,
                    },
                },
            },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        return job;
    }

    async approveJob(id: string, dto: ApproveJobDto, actorId: string) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            select: { id: true, status: true, jobTitle: true },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        if (job.status !== JobStatus.PENDING) {
            throw new BadRequestException('Only PENDING jobs can be approved');
        }

        const updated = await this.prisma.job.update({
            where: { id },
            data: { status: JobStatus.APPROVED, publishedAt: new Date() },
            select: { id: true, jobTitle: true, status: true, publishedAt: true },
        });

        await this.aiQueue.add(
            AI_JOB_NAMES.EMBED_JOB,
            { jobId: updated.id }
        );

        this.auditService.logAction({
            actorId,
            actorRole: 'ADMIN',
            action: 'jobs:approve',
            module: 'JOBS',
            targetType: 'Job',
            targetId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
            oldData: { status: JobStatus.PENDING },
            newData: { status: JobStatus.APPROVED, adminNotes: dto.adminNotes },
        });

        return updated;
    }

    async rejectJob(id: string, dto: RejectJobDto, actorId: string) {
        const job = await this.prisma.job.findUnique({
            where: { id },
            select: { id: true, status: true, jobTitle: true },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        if (job.status !== JobStatus.PENDING) {
            throw new BadRequestException('Only PENDING jobs can be rejected');
        }

        const updated = await this.prisma.job.update({
            where: { id },
            data: { status: JobStatus.REJECTED, rejectionReason: dto.reason },
            select: { id: true, jobTitle: true, status: true, rejectionReason: true },
        });

        this.auditService.logAction({
            actorId,
            actorRole: 'ADMIN',
            action: 'jobs:reject',
            module: 'JOBS',
            targetType: 'Job',
            targetId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
            oldData: { status: JobStatus.PENDING },
            newData: { status: JobStatus.REJECTED, reason: dto.reason, adminNotes: dto.adminNotes },
        });

        return updated;
    }
}
