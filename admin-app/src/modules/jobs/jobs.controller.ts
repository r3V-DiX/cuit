// admin-app/src/admin/controllers/jobs.controller.ts

import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { AdminJobsService } from './jobs.service';
import { AdminJobListQueryDto, ApproveJobDto, RejectJobDto, SetFeaturedJobDto } from './dto/jobs.dto';

@Controller('admin/jobs')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminJobsController {
    constructor(private readonly jobsService: AdminJobsService) {}

    // GET /admin/jobs — job approvals queue (default: PENDING_APPROVAL)
    @Get()
    @RequirePermission(ACTIONS.JOBS.VIEW)
    list(@Query() query: AdminJobListQueryDto) {
        return this.jobsService.list(query);
    }

    // GET /admin/jobs/:id
    @Get(':id')
    @RequirePermission(ACTIONS.JOBS.VIEW)
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.jobsService.getById(id);
    }

    // PATCH /admin/jobs/:id/approve
    @Patch(':id/approve')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.REVIEW)
    approve(
        @CurrentAdmin() admin: Admin,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ApproveJobDto,
    ) {
        return this.jobsService.approve(id, admin.id, dto);
    }

    // PATCH /admin/jobs/:id/reject
    @Patch(':id/reject')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.REVIEW)
    reject(
        @CurrentAdmin() admin: Admin,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RejectJobDto,
    ) {
        return this.jobsService.reject(id, admin.id, dto);
    }

    // PATCH /admin/jobs/:id/feature
    @Patch(':id/feature')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.FEATURE)
    setFeatured(
        @CurrentAdmin() admin: Admin,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SetFeaturedJobDto,
    ) {
        return this.jobsService.setFeatured(id, admin.id, dto);
    }
}
