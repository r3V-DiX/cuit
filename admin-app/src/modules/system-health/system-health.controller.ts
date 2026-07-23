// admin-app/src/modules/system-health/system-health.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import { SystemHealthService } from './system-health.service';

@Controller('admin/system')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class SystemHealthController {
    constructor(private readonly service: SystemHealthService) {}

    // GET /admin/system/health
    @Get('health')
    @RequirePermission(ACTIONS.DASHBOARD.VIEW)
    getHealth() {
        return this.service.getHealth();
    }
}
