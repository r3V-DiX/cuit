// apps/employer-service/src/employer/controllers/analytics.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import { AnalyticsService } from '../services/analytics.service';

@Controller('employer/analytics')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard, PermissionGuard)
@Roles(UserRole.EMPLOYER)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    // GET /employer/analytics — job performance + application funnel summary.
    // Gated on limits.analyticsEnabled inside the service, same pattern as
    // canExportApplicants in applications.service.ts.
    @Get()
    @RequirePermission(ACTIONS.JOBS.READ)
    getSummary(@CurrentUser() user: User) {
        return this.analyticsService.getSummary(user.id);
    }
}
