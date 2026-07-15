// admin-app/src/admin/services/jobs.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminJobsRepository } from './jobs.repository';
import { AdminJobListQueryDto, ApproveJobDto, RejectJobDto } from './dto/jobs.dto';
import { AdminAuditLogger } from '../../common';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';

const NON_REVIEWABLE_STATUSES: JobStatus[] = [JobStatus.DRAFT, JobStatus.CLOSED, JobStatus.EXPIRED];

@Injectable()
export class AdminJobsService {
    constructor(
        private readonly jobsRepository: AdminJobsRepository,
        private readonly auditLogger: AdminAuditLogger,
        private readonly eventPublisher: EventPublisher,
        private readonly prisma: PrismaService,
    ) {}

    async list(query: AdminJobListQueryDto) {
        return this.jobsRepository.findAll(query);
    }

    async getById(id: string) {
        const job = await this.jobsRepository.findById(id);
        if (!job) throw new NotFoundException('Job not found');
        return job;
    }

    async approve(id: string, adminId: string, dto: ApproveJobDto) {
        const job = await this.getById(id);

        if (NON_REVIEWABLE_STATUSES.includes(job.status)) {
            throw new BadRequestException(`Cannot approve job with status ${job.status}`);
        }

        if (job.status === JobStatus.APPROVED) {
            throw new BadRequestException('Job already approved');
        }

        const updated = await this.jobsRepository.approve(id);

        this.auditLogger.log({
            adminId,
            action: 'jobs:approve',
            module: 'jobs',
            resource: 'Job',
            resourceId: id,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        // Notify employer owner
        const owner = await this.prisma.employerMember.findFirst({
            where: { employerId: job.employerId, role: 'OWNER' },
            select: { userId: true },
        });
        if (owner) {
            this.eventPublisher.publish(
                DomainEventType.JOB_APPROVED,
                {
                    jobId: id,
                    jobTitle: job.jobTitle,
                    employerId: job.employerId,
                    employerUserId: owner.userId,
                },
                'admin-app',
            );
        }

        return updated;
    }

    async reject(id: string, adminId: string, dto: RejectJobDto) {
        const job = await this.getById(id);

        if (NON_REVIEWABLE_STATUSES.includes(job.status)) {
            throw new BadRequestException(`Cannot reject job with status ${job.status}`);
        }

        if (job.status === JobStatus.REJECTED) {
            throw new BadRequestException('Job already rejected');
        }

        const updated = await this.jobsRepository.reject(id, dto.reason);

        this.auditLogger.log({
            adminId,
            action: 'jobs:reject',
            module: 'jobs',
            resource: 'Job',
            resourceId: id,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        // Notify employer owner
        const owner = await this.prisma.employerMember.findFirst({
            where: { employerId: job.employerId, role: 'OWNER' },
            select: { userId: true },
        });
        if (owner) {
            this.eventPublisher.publish(
                DomainEventType.JOB_REJECTED,
                {
                    jobId: id,
                    jobTitle: job.jobTitle,
                    employerId: job.employerId,
                    employerUserId: owner.userId,
                    rejectionReason: dto.reason,
                },
                'admin-app',
            );
        }

        return updated;
    }
}
