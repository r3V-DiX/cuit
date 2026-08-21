// apps/employer-service/src/employer/controllers/applications.controller.ts

import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Query,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    StreamableFile,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { EmployerApplicationsService } from '../services/applications.service';
import { ApplicationListQueryDto, UpdateApplicationStatusDto } from '../dto/application.dto';
import { KycVerifiedGuard } from '../guards/kyc-verified.guard';

@Controller('employer')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard, KycVerifiedGuard, PermissionGuard)
@Roles(UserRole.EMPLOYER)
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

    // GET /employer/jobs/:jobId/applications/export — MUST be before /:id to avoid param capture
    @Get('jobs/:jobId/applications/export')
    @RequirePermission(ACTIONS.APPLICATIONS.READ_ALL)
    exportForJob(
        @CurrentUser() user: User,
        @Param('jobId', ParseUUIDPipe) jobId: string,
    ) {
        return this.applicationsService.exportForJob(user.id, jobId);
    }

    // GET /employer/jobs/:jobId/applications/:id
    @Get('jobs/:jobId/applications/:id')
    @RequirePermission(ACTIONS.APPLICATIONS.READ_ALL)
    getOne(
        @CurrentUser() user: User,
        @Param('jobId', ParseUUIDPipe) jobId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.applicationsService.getOne(user.id, id, jobId);
    }

    // GET /employer/applications/:id
    @Get('applications/:id')
    @RequirePermission(ACTIONS.APPLICATIONS.READ_ALL)
    getOneGlobal(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.applicationsService.getOne(user.id, id);
    }

    // GET /employer/applications/:id/resume — streams the resume file directly
    @Get('applications/:id/resume')
    @RequirePermission(ACTIONS.APPLICATIONS.READ_ALL)
    getResume(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<StreamableFile> {
        return this.applicationsService.getResumeStream(user.id, id);
    }

    // PATCH /employer/jobs/:jobId/applications/:id/status
    @Patch('jobs/:jobId/applications/:id/status')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.APPLICATIONS.UPDATE_STATUS)
    updateStatus(
        @CurrentUser() user: User,
        @Param('jobId', ParseUUIDPipe) jobId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateApplicationStatusDto,
        @Req() req: Request,
    ) {
        return this.applicationsService.updateStatus(user.id, id, dto, jobId, req.ip, req.headers['user-agent']);
    }

    // PATCH /employer/applications/:id/status
    @Patch('applications/:id/status')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.APPLICATIONS.UPDATE_STATUS)
    updateStatusGlobal(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateApplicationStatusDto,
        @Req() req: Request,
    ) {
        return this.applicationsService.updateStatus(user.id, id, dto, undefined, req.ip, req.headers['user-agent']);
    }
}
