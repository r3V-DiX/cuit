// apps/employer-service/src/employer/controllers/jobs.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { JobsService } from '../services/jobs.service';
import { CreateJobDto, UpdateJobDto, CloseJobDto, JobListQueryDto } from '../dto/job.dto';

@Controller('employer/jobs')
@UseGuards(AuthGuard, PermissionGuard)
export class JobsController {
    constructor(private readonly jobsService: JobsService) {}

    // ── GET /employer/jobs ──────────────────────────────────────────────────

    @Get()
    @RequirePermission(ACTIONS.JOBS.READ)
    list(@CurrentUser() user: User, @Query() query: JobListQueryDto) {
        return this.jobsService.list(user.id, query);
    }

    // ── GET /employer/jobs/:id ──────────────────────────────────────────────

    @Get(':id')
    @RequirePermission(ACTIONS.JOBS.READ)
    getOne(@CurrentUser() user: User, @Param('id') id: string) {
        return this.jobsService.getOne(user.id, id);
    }

    // ── POST /employer/jobs/improve-description ─────────────────────────────

    @Post('improve-description')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.CREATE)
    improveDescription(
        @CurrentUser() user: User, 
        @Body() body: { title: string, description: string, jobType?: string, experienceLevel?: string }
    ) {
        if (!body.title || !body.description) {
            throw new BadRequestException('Title and description are required');
        }
        return this.jobsService.improveDescription(user.id, body.title, body.description, body.jobType, body.experienceLevel);
    }

    // ── POST /employer/jobs/suggest-skills ──────────────────────────────────

    @Post('suggest-skills')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.CREATE)
    suggestSkills(
        @CurrentUser() user: User, 
        @Body() body: { title: string, description: string }
    ) {
        if (!body.title || !body.description) {
            throw new BadRequestException('Title and description are required');
        }
        return this.jobsService.suggestSkills(user.id, body.title, body.description);
    }

    // ── POST /employer/jobs ─────────────────────────────────────────────────

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.JOBS.CREATE)
    create(@CurrentUser() user: User, @Body() dto: CreateJobDto, @Req() req: Request) {
        return this.jobsService.create(user.id, dto, req.ip, req.headers['user-agent']);
    }

    // ── PATCH /employer/jobs/:id ────────────────────────────────────────────

    @Patch(':id')
    @RequirePermission(ACTIONS.JOBS.UPDATE)
    update(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateJobDto,
        @Req() req: Request,
    ) {
        return this.jobsService.update(user.id, id, dto, req.ip, req.headers['user-agent']);
    }

    // ── POST /employer/jobs/:id/submit ──────────────────────────────────────

    @Post(':id/submit')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.PUBLISH)
    submit(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
        return this.jobsService.submit(user.id, id, req.ip, req.headers['user-agent']);
    }

    // ── POST /employer/jobs/:id/close ───────────────────────────────────────

    @Post(':id/close')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.CLOSE)
    close(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() dto: CloseJobDto,
        @Req() req: Request,
    ) {
        return this.jobsService.close(user.id, id, dto, req.ip, req.headers['user-agent']);
    }

    // ── DELETE /employer/jobs/:id ───────────────────────────────────────────

    @Delete(':id')
    @RequirePermission(ACTIONS.JOBS.DELETE)
    remove(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
        return this.jobsService.delete(user.id, id, req.ip, req.headers['user-agent']);
    }

    // ── POST /employer/jobs/:id/reopen ──────────────────────────────────────

    @Post(':id/reopen')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.PUBLISH)
    reopen(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
        return this.jobsService.reopen(user.id, id, req.ip, req.headers['user-agent']);
    }

    // ── POST /employer/jobs/:id/ai-rank ─────────────────────────────────────

    @Post(':id/ai-rank')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.JOBS.UPDATE)
    rankApplications(@CurrentUser() user: User, @Param('id') id: string, @Req() req: Request) {
        return this.jobsService.rankApplications(user.id, id, req.ip, req.headers['user-agent']);
    }
}
