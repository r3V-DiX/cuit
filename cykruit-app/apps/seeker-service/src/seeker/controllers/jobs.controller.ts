// apps/seeker-service/src/seeker/controllers/jobs.controller.ts

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, OptionalAuthGuard, RolesGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { UserRole, type User } from '@prisma/client';
import { JobsService } from '../services/jobs.service';
import { JobSearchDto } from '../dto/job-search.dto';

@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) {}

    // ── GET /jobs ─────────────────────────────────────────────────────────────
    // Optional auth: logged-in seekers get isApplied / isSaved annotations.

    @Get()
    @UseGuards(OptionalAuthGuard)
    search(@Query() query: JobSearchDto, @CurrentUser() user?: User) {
        return this.jobsService.search(query, user?.id);
    }

    // ── GET /jobs/recommended ─────────────────────────────────────────────────

    @Get('recommended')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.SEEKER)
    getRecommendedJobs(@Query('limit') limit: string, @CurrentUser() user: User) {
        return this.jobsService.getRecommendedJobs(user.id, limit ? parseInt(limit, 10) : 3);
    }

    // ── GET /jobs/:slug ───────────────────────────────────────────────────────

    @Get(':slug')
    @UseGuards(OptionalAuthGuard)
    getBySlug(@Param('slug') slug: string, @CurrentUser() user?: User) {
        return this.jobsService.getBySlug(slug, user?.id);
    }

    // ── GET /jobs/:slug/match-score ──────────────────────────────────────────

    @Get(':slug/match-score')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.SEEKER)
    getMatchScore(@Param('slug') slug: string, @CurrentUser() user: User) {
        return this.jobsService.getMatchScore(slug, user.id);
    }
}
