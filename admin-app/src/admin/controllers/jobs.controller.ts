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
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { AdminGuard } from '../guards/admin.guard';
import type { User } from '@prisma/client';
import { AdminJobsService } from '../services/jobs.service';
import { AdminJobListQueryDto, ApproveJobDto, RejectJobDto } from '../dto/jobs.dto';

@Controller('admin/jobs')
@UseGuards(AuthGuard, AdminGuard)
export class AdminJobsController {
    constructor(private readonly jobsService: AdminJobsService) {}

    // GET /admin/jobs — job approvals queue (default: PENDING_APPROVAL)
    @Get()
    list(@Query() query: AdminJobListQueryDto) {
        return this.jobsService.list(query);
    }

    // GET /admin/jobs/:id
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.jobsService.getById(id);
    }

    // PATCH /admin/jobs/:id/approve
    @Patch(':id/approve')
    @HttpCode(HttpStatus.OK)
    approve(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: ApproveJobDto,
    ) {
        return this.jobsService.approve(id, admin.id, dto);
    }

    // PATCH /admin/jobs/:id/reject
    @Patch(':id/reject')
    @HttpCode(HttpStatus.OK)
    reject(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: RejectJobDto,
    ) {
        return this.jobsService.reject(id, admin.id, dto);
    }
}
