// apps/employer-service/src/employer/controllers/applications.controller.ts

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
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import type { User } from '@prisma/client';
import { EmployerApplicationsService } from '../services/applications.service';
import { ApplicationListQueryDto, UpdateApplicationStatusDto } from '../dto/application.dto';

@Controller('employer/jobs')
@UseGuards(AuthGuard, PermissionGuard)
export class ApplicationsController {
    constructor(private readonly applicationsService: EmployerApplicationsService) {}

    // GET /employer/jobs/:jobId/applications
    @Get(':jobId/applications')
    @RequirePermission(ACTIONS.APPLICATIONS.READ)
    listForJob(
        @CurrentUser() user: User,
        @Param('jobId') jobId: string,
        @Query() query: ApplicationListQueryDto,
    ) {
        return this.applicationsService.listForJob(user.id, jobId, query);
    }

    // GET /employer/jobs/:jobId/applications/:id
    @Get(':jobId/applications/:id')
    @RequirePermission(ACTIONS.APPLICATIONS.READ)
    getOne(
        @CurrentUser() user: User,
        @Param('id') id: string,
    ) {
        return this.applicationsService.getOne(user.id, id);
    }

    // PATCH /employer/jobs/:jobId/applications/:id/status
    @Patch(':jobId/applications/:id/status')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.APPLICATIONS.UPDATE_STATUS)
    updateStatus(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateApplicationStatusDto,
    ) {
        return this.applicationsService.updateStatus(user.id, id, dto);
    }
}
