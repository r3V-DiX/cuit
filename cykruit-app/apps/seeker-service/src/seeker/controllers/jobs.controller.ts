// apps/seeker-service/src/seeker/controllers/jobs.controller.ts

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, OptionalAuthGuard, CurrentUser } from '@cykruit/auth-core';
import type { User } from '@prisma/client';
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

    // ── GET /jobs/:slug ───────────────────────────────────────────────────────

    @Get(':slug')
    @UseGuards(OptionalAuthGuard)
    getBySlug(@Param('slug') slug: string, @CurrentUser() user?: User) {
        return this.jobsService.getBySlug(slug, user?.id);
    }

    // ── GET /jobs/:slug/match-score ──────────────────────────────────────────

    @Get(':slug/match-score')
    @UseGuards(AuthGuard)
    getMatchScore(@Param('slug') slug: string, @CurrentUser() user: User) {
        return this.jobsService.getMatchScore(slug, user.id);
    }
}
