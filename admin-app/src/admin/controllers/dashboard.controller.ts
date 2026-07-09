// admin-app/src/admin/controllers/dashboard.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { ACTIONS } from '../rbac/permissions.registry';
import { DashboardService } from '../services/dashboard.service';

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    @RequirePermission(ACTIONS.DASHBOARD.VIEW)
    getOverview() {
        return this.dashboardService.getOverview();
    }
}
