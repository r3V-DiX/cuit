// apps/employer-service/src/employer/services/job-expiry.service.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '@cykruit/logger';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { PrismaService } from '@cykruit/prisma';
import { JobStatus } from '@prisma/client';

const EXPIRY_WARNING_DAYS = 3;

@Injectable()
export class JobExpiryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventPublisher: EventPublisher,
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
}
