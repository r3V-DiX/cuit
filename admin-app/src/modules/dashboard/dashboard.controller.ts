// admin-app/src/admin/controllers/dashboard.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import { DashboardService } from './dashboard.service';

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
