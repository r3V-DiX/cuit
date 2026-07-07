// admin-app/src/admin/repositories/dashboard.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { JobStatus, VerificationStatus, AccountStatus, UserRole } from '@prisma/client';
// EmployerSubscription.status is a plain String field — use string literal 'ACTIVE'

@Injectable()
export class DashboardRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getStats() {
        const [
            totalUsers,
            seekers,
            employers,
            activeJobs,
            pendingJobs,
            pendingKyc,
            totalApplications,
            activeSubscriptions,
        ] = await this.prisma.$transaction([
            this.prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
            this.prisma.user.count({ where: { role: UserRole.SEEKER, status: AccountStatus.ACTIVE } }),
            this.prisma.user.count({ where: { role: UserRole.EMPLOYER, status: AccountStatus.ACTIVE } }),
            this.prisma.job.count({ where: { status: JobStatus.APPROVED } }),
            this.prisma.job.count({ where: { status: JobStatus.PENDING } }),
            this.prisma.employerVerification.count({
                where: { status: VerificationStatus.PENDING, isLatest: true },
            }),
            this.prisma.application.count(),
            this.prisma.employerSubscription.count({ where: { status: 'ACTIVE' } }),
        ]);

        return {
            users: { total: totalUsers, seekers, employers },
            jobs: { active: activeJobs, pendingApproval: pendingJobs },
            kyc: { pendingReview: pendingKyc },
            applications: { total: totalApplications },
            subscriptions: { active: activeSubscriptions },
        };
    }

    async getRecentRegistrations(days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        return this.prisma.user.groupBy({
            by: ['role'],
            where: { createdAt: { gte: since } },
            _count: { id: true },
        });
    }

    async getJobTrends(days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        return this.prisma.job.count({
            where: {
                status: JobStatus.APPROVED,
                publishedAt: { gte: since },
            },
        });
    }
}
