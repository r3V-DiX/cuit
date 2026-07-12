import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AuthGuard } from '@cykruit/auth-core';
import { AdminGuard } from '../guards/admin.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('Admin Dashboard')
@Controller('auth/admin/dashboard')
@UseGuards(AuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin dashboard aggregate stats' })
  @ApiOkResponse({ description: 'Aggregate stats for the admin dashboard' })
  getDashboard() {
    return this.adminDashboardService.getDashboard();
  }
}
