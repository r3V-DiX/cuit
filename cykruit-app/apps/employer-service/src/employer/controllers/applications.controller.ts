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

@Controller('employer')
@UseGuards(AuthGuard, PermissionGuard)
export class ApplicationsController {
    constructor(private readonly applicationsService: EmployerApplicationsService) {}

    // GET /employer/applications
    @Get('applications')
    @RequirePermission(ACTIONS.APPLICATIONS.READ_ALL)
    listAll(
        @CurrentUser() user: User,
        @Query() query: ApplicationListQueryDto,
    ) {
        return this.applicationsService.listForEmployer(user.id, query);
    }

    // GET /employer/jobs/:jobId/applications
    @Get('jobs/:jobId/applications')
    @RequirePermission(ACTIONS.APPLICATIONS.READ_ALL)
    listForJob(
        @CurrentUser() user: User,
        @Param('jobId') jobId: string,
        @Query() query: ApplicationListQueryDto,
    ) {
        return this.applicationsService.listForJob(user.id, jobId, query);
    }

    // GET /employer/jobs/:jobId/applications/:id
    @Get('jobs/:jobId/applications/:id')
    @RequirePermission(ACTIONS.APPLICATIONS.READ_ALL)
    getOne(
        @CurrentUser() user: User,
        @Param('id') id: string,
    ) {
        return this.applicationsService.getOne(user.id, id);
    }

    // GET /employer/applications/:id
    @Get('applications/:id')
    @RequirePermission(ACTIONS.APPLICATIONS.READ_ALL)
    getOneGlobal(
        @CurrentUser() user: User,
        @Param('id') id: string,
    ) {
        return this.applicationsService.getOne(user.id, id);
    }

    // PATCH /employer/jobs/:jobId/applications/:id/status
    @Patch('jobs/:jobId/applications/:id/status')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.APPLICATIONS.UPDATE_STATUS)
    updateStatus(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateApplicationStatusDto,
    ) {
        return this.applicationsService.updateStatus(user.id, id, dto);
    }

    // PATCH /employer/applications/:id/status
    @Patch('applications/:id/status')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.APPLICATIONS.UPDATE_STATUS)
    updateStatusGlobal(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateApplicationStatusDto,
    ) {
        return this.applicationsService.updateStatus(user.id, id, dto);
    }
}
