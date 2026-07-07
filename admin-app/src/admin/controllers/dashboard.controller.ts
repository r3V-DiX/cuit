// admin-app/src/admin/controllers/dashboard.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@cykruit/auth-core';
import { AdminGuard } from '../guards/admin.guard';
import { DashboardService } from '../services/dashboard.service';

@Controller('admin/dashboard')
@UseGuards(AuthGuard, AdminGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    getOverview() {
        return this.dashboardService.getOverview();
    }
}
