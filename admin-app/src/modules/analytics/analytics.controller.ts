// admin-app/src/modules/analytics/analytics.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics.dto';

@Controller('admin/analytics')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermission(ACTIONS.DASHBOARD.VIEW)
export class AnalyticsController {
    constructor(private readonly service: AnalyticsService) {}

    // GET /admin/analytics/revenue
    @Get('revenue')
    revenue(@Query() query: AnalyticsQueryDto) {
        return this.service.getRevenue(query.period ?? '30d');
    }

    // GET /admin/analytics/subscriptions
    @Get('subscriptions')
    subscriptions(@Query() query: AnalyticsQueryDto) {
        return this.service.getSubscriptions(query.period ?? '30d');
    }

    // GET /admin/analytics/users
    @Get('users')
    users(@Query() query: AnalyticsQueryDto) {
        return this.service.getUsers(query.period ?? '30d');
    }

    // GET /admin/analytics/jobs
    @Get('jobs')
    jobs(@Query() query: AnalyticsQueryDto) {
        return this.service.getJobs(query.period ?? '30d');
    }

    // GET /admin/analytics/applications
    @Get('applications')
    applications(@Query() query: AnalyticsQueryDto) {
        return this.service.getApplications(query.period ?? '30d');
    }
}
