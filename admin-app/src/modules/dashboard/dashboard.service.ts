// admin-app/src/admin/services/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
    constructor(private readonly dashboardRepository: DashboardRepository) {}

    async getOverview() {
        const [stats, recentRegistrations, newJobsThisMonth] = await Promise.all([
            this.dashboardRepository.getStats(),
            this.dashboardRepository.getRecentRegistrations(30),
            this.dashboardRepository.getJobTrends(30),
        ]);

        return {
            ...stats,
            recentActivity: {
                newRegistrations30d: recentRegistrations.reduce((sum, g) => sum + g._count.id, 0),
                byRole: recentRegistrations.map((g) => ({ role: g.role, count: g._count.id })),
                newApprovedJobs30d: newJobsThisMonth,
            },
        };
    }
}
