// apps/employer-service/src/employer/controllers/admin-jobs.controller.ts

import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import { AdminGuard } from '../guards/admin.guard';
import { AdminJobsService } from '../services/admin-jobs.service';
import { AdminJobQueryDto, ApproveJobDto, RejectJobDto } from '../dto/admin-jobs.dto';

@Controller('employer/admin/jobs')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AdminJobsController {
    constructor(private readonly adminJobsService: AdminJobsService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.READ)
    listJobs(@Query() query: AdminJobQueryDto) {
        return this.adminJobsService.listJobs(query);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.READ)
    getJob(@Param('id', ParseUUIDPipe) id: string) {
        return this.adminJobsService.getJob(id);
    }

    @Patch(':id/approve')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.APPROVE)
    approveJob(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ApproveJobDto,
        @CurrentUser() user: User,
    ) {
        return this.adminJobsService.approveJob(id, dto, user.id);
    }

    @Patch(':id/reject')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.REJECT)
    rejectJob(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RejectJobDto,
        @CurrentUser() user: User,
    ) {
        return this.adminJobsService.rejectJob(id, dto, user.id);
    }
}
