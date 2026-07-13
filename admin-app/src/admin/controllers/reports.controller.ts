// admin-app/src/admin/controllers/reports.controller.ts

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { ACTIONS } from '../rbac/permissions.registry';
import type { Admin } from '@prisma/client';
import { ReportsService } from '../services/reports.service';
import { ReportListQueryDto, ResolveReportDto, DismissReportDto } from '../dto/reports.dto';

@Controller('admin/reports')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class ReportsController {
    constructor(private readonly service: ReportsService) {}

    // GET /admin/reports
    @Get()
    @RequirePermission(ACTIONS.REPORTS.VIEW)
    list(@Query() query: ReportListQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/reports/:id
    @Get(':id')
    @RequirePermission(ACTIONS.REPORTS.VIEW)
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // PATCH /admin/reports/:id/resolve
    @Patch(':id/resolve')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.REPORTS.MANAGE)
    resolve(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: ResolveReportDto,
    ) {
        return this.service.resolve(admin.id, id, dto);
    }

    // PATCH /admin/reports/:id/dismiss
    @Patch(':id/dismiss')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.REPORTS.MANAGE)
    dismiss(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: DismissReportDto,
    ) {
        return this.service.dismiss(admin.id, id, dto);
    }
}
