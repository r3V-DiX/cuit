// apps/seeker-service/src/seeker/controllers/applications.controller.ts

import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { ApplicationsService } from '../services/applications.service';
import {
    ApplyJobDto,
    WithdrawApplicationDto,
    ApplicationListQueryDto,
} from '../dto/apply-job.dto';

@Controller()
@UseGuards(AuthGuard)
export class ApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) {}

    // ── POST /jobs/:id/apply ──────────────────────────────────────────────────

    @Post('jobs/:id/apply')
    @HttpCode(HttpStatus.CREATED)
    apply(
        @CurrentUser() user: User,
        @Param('id') jobId: string,
        @Body() dto: ApplyJobDto,
        @Req() req: Request,
    ) {
        return this.applicationsService.apply(user.id, jobId, dto, req.ip, req.headers['user-agent']);
    }

    // ── DELETE /applications/:id (withdraw) ──────────────────────────────────
    // Route uses applicationId — callers look up their applicationId from GET /applications

    @Delete('applications/:id')
    @HttpCode(HttpStatus.OK)
    withdraw(
        @CurrentUser() user: User,
        @Param('id') applicationId: string,
        @Body() dto: WithdrawApplicationDto,
        @Req() req: Request,
    ) {
        return this.applicationsService.withdraw(user.id, applicationId, dto, req.ip, req.headers['user-agent']);
    }

    // ── GET /applications ─────────────────────────────────────────────────────

    @Get('applications')
    list(@CurrentUser() user: User, @Query() query: ApplicationListQueryDto) {
        return this.applicationsService.list(user.id, query);
    }

    // ── GET /applications/:id ─────────────────────────────────────────────────

    @Get('applications/:id')
    getOne(@CurrentUser() user: User, @Param('id') id: string) {
        return this.applicationsService.getOne(user.id, id);
    }
}
