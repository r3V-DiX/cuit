import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { UserRole } from '@prisma/client';

interface RoleCount {
  role: UserRole;
  count: number;
}

export interface DashboardStats {
  users: {
    total: number;
    seekers: number;
    employers: number;
  };
  jobs: {
    active: number;
    pendingApproval: number;
  };
  kyc: {
    pendingReview: number;
  };
  applications: {
    total: number;
  };
  subscriptions: {
    active: number;
  };
  recentActivity: {
    newRegistrations30d: number;
    newApprovedJobs30d: number;
    byRole: RoleCount[];
  };
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      seekerCount,
      employerCount,
      activeJobs,
      pendingJobs,
      kycPending,
      totalApplications,
      activeSubscriptions,
      newRegistrations30d,
      newApprovedJobs30d,
      registrationsByRole,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'SEEKER' } }),
      this.prisma.user.count({ where: { role: 'EMPLOYER' } }),
      this.prisma.job.count({ where: { status: 'APPROVED' } }),
      this.prisma.job.count({ where: { status: 'PENDING' } }),
      this.prisma.employerVerification.count({ where: { status: 'PENDING', isLatest: true } }),
      this.prisma.application.count(),
      this.prisma.employerSubscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.job.count({ where: { status: 'APPROVED', publishedAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { role: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        seekers: seekerCount,
        employers: employerCount,
      },
      jobs: {
        active: activeJobs,
        pendingApproval: pendingJobs,
      },
      kyc: {
        pendingReview: kycPending,
      },
      applications: {
        total: totalApplications,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
      recentActivity: {
        newRegistrations30d,
        newApprovedJobs30d,
        byRole: registrationsByRole.map((r) => ({
          role: r.role,
          count: r._count.role,
        })),
      },
    };
  }
}
