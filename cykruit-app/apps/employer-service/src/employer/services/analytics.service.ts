// apps/employer-service/src/employer/services/analytics.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';
import { EmployerLimitsService } from '@cykruit/subscription';
import { CompanyRepository } from '../repositories/company.repository';

const TOP_JOBS_LIMIT = 8;

@Injectable()
export class AnalyticsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly companyRepo: CompanyRepository,
        private readonly employerLimitsService: EmployerLimitsService,
    ) {}

    private async resolveEmployer(userId: string) {
        const employer = await this.companyRepo.findByMemberId(userId);
        if (!employer) throw new NotFoundException('No company found for your account');
        return employer;
    }

    async getSummary(userId: string) {
        const employer = await this.resolveEmployer(userId);

        const limits = await this.employerLimitsService.resolveForEmployer(employer.id);
        if (!limits.analyticsEnabled) {
            throw new ForbiddenException('Analytics is not available on your current plan.');
        }

        const [jobAggregate, jobGroups, applicationTotal, applicationGroups, topJobs] =
            await Promise.all([
                this.prisma.job.aggregate({
                    where: { employerId: employer.id },
                    _sum: { viewCount: true },
                }),
                this.prisma.job.groupBy({
                    by: ['status'],
                    where: { employerId: employer.id },
                    _count: true,
                }),
                this.prisma.application.count({
                    where: { job: { employerId: employer.id } },
                }),
                this.prisma.application.groupBy({
                    by: ['status'],
                    where: { job: { employerId: employer.id } },
                    _count: true,
                }),
                this.prisma.job.findMany({
                    where: { employerId: employer.id, status: JobStatus.APPROVED },
                    orderBy: { applicationCount: 'desc' },
                    take: TOP_JOBS_LIMIT,
                    select: { id: true, jobTitle: true, viewCount: true, applicationCount: true },
                }),
            ]);

        const totalViews = jobAggregate._sum.viewCount ?? 0;
        const totalApplications = applicationTotal;
        const conversionRate = totalViews > 0
            ? Math.round((totalApplications / totalViews) * 1000) / 10
            : 0;

        const statusCounts = { active: 0, pending: 0, draft: 0, closed: 0 };
        for (const g of jobGroups) {
            if (g.status === JobStatus.APPROVED) statusCounts.active = g._count;
            else if (g.status === JobStatus.PENDING) statusCounts.pending = g._count;
            else if (g.status === JobStatus.DRAFT) statusCounts.draft = g._count;
            else if (g.status === JobStatus.CLOSED) statusCounts.closed = g._count;
        }

        const applicationStatusBreakdown: Record<string, number> = {};
        for (const g of applicationGroups) {
            applicationStatusBreakdown[g.status] = g._count;
        }

        return {
            totalViews,
            totalApplications,
            conversionRate,
            statusCounts,
            applicationStatusBreakdown,
            topJobs,
        };
    }
}
