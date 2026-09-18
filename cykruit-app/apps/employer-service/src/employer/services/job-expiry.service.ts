// apps/employer-service/src/employer/services/job-expiry.service.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '@cykruit/logger';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { PrismaService } from '@cykruit/prisma';
import { AuditService } from '@cykruit/audit';
import { JobStatus } from '@prisma/client';
import { JobsRepository } from '../repositories/jobs.repository';

const EXPIRY_WARNING_DAYS = 3;
const EXPIRE_BATCH_SIZE = 200;

@Injectable()
export class JobExpiryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jobsRepository: JobsRepository,
        private readonly eventPublisher: EventPublisher,
        private readonly auditService: AuditService,
        private readonly logger: AppLogger,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async notifyExpiringJobs(): Promise<void> {
        const now = new Date();
        const windowEnd = new Date(now);
        windowEnd.setDate(windowEnd.getDate() + EXPIRY_WARNING_DAYS);
        windowEnd.setHours(23, 59, 59, 999);

        const jobs = await this.prisma.job.findMany({
            where: {
                status: JobStatus.APPROVED,
                expiresAt: { gte: now, lte: windowEnd },
            },
            select: {
                id: true,
                jobTitle: true,
                employerId: true,
                expiresAt: true,
            },
        });

        if (!jobs.length) return;

        this.logger.log(`Sending expiry alerts for ${jobs.length} jobs`, 'JobExpiryService');

        for (const job of jobs) {
            const owner = await this.prisma.employerMember.findFirst({
                where: { employerId: job.employerId, role: 'OWNER' },
                select: { userId: true },
            });
            if (owner && job.expiresAt) {
                this.eventPublisher.publish(
                    DomainEventType.JOB_EXPIRING_SOON,
                    {
                        jobId: job.id,
                        jobTitle: job.jobTitle,
                        employerId: job.employerId,
                        employerUserId: owner.userId,
                        expiresAt: job.expiresAt.toISOString(),
                    },
                    'employer-service',
                );
            }
        }
    }

    /** Runs daily. Marks APPROVED jobs as EXPIRED once expiresAt has passed. */
    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async expireStaleJobs(): Promise<void> {
        this.logger.log('Running job expiry check', 'JobExpiryService');

        let totalExpired = 0;
        let batch: Array<{ id: string; jobTitle: string | null; employerId: string }>;

        do {
            batch = await this.jobsRepository.findExpiredApproved(EXPIRE_BATCH_SIZE);
            if (!batch.length) break;

            const ids = batch.map((j) => j.id);
            const count = await this.jobsRepository.expireMany(ids);
            totalExpired += count;

            for (const job of batch) {
                this.auditService.logAction({
                    actorId: null,
                    actorRole: 'SYSTEM',
                    action: 'jobs:auto_expire',
                    module: 'JOBS',
                    targetType: 'Job',
                    targetId: job.id,
                    newData: { status: 'EXPIRED', employerId: job.employerId },
                    result: 'SUCCESS',
                });

                const owner = await this.prisma.employerMember.findFirst({
                    where: { employerId: job.employerId, role: 'OWNER' },
                    select: { userId: true },
                });
                if (owner) {
                    this.eventPublisher.publish(
                        DomainEventType.JOB_EXPIRED,
                        {
                            jobId: job.id,
                            jobTitle: job.jobTitle,
                            employerId: job.employerId,
                            employerUserId: owner.userId,
                        },
                        'employer-service',
                    ).catch((err: unknown) =>
                        this.logger.warn(`JOB_EXPIRED publish failed: ${String(err)}`, 'JobExpiryService'),
                    );
                }
            }
        } while (batch.length === EXPIRE_BATCH_SIZE);

        if (totalExpired > 0) {
            this.logger.log(`Expired ${totalExpired} job(s)`, 'JobExpiryService');
        }
    }
}
