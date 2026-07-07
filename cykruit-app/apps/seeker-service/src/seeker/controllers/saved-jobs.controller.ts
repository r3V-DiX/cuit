// apps/seeker-service/src/seeker/controllers/saved-jobs.controller.ts

import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import type { User } from '@prisma/client';
import { SavedJobsService } from '../services/saved-jobs.service';
import { SaveJobDto, SavedJobListQueryDto } from '../dto/saved-job.dto';

@Controller()
@UseGuards(AuthGuard)
export class SavedJobsController {
    constructor(private readonly savedJobsService: SavedJobsService) {}

    // ── GET /saved-jobs ───────────────────────────────────────────────────────

    @Get('saved-jobs')
    list(@CurrentUser() user: User, @Query() query: SavedJobListQueryDto) {
        return this.savedJobsService.list(user.id, query);
    }

    // ── POST /jobs/:id/save ───────────────────────────────────────────────────

    @Post('jobs/:id/save')
    @HttpCode(HttpStatus.CREATED)
    save(
        @CurrentUser() user: User,
        @Param('id') jobId: string,
        @Body() dto: SaveJobDto,
    ) {
        return this.savedJobsService.save(user.id, jobId, dto);
    }

    // ── DELETE /jobs/:id/save ─────────────────────────────────────────────────

    @Delete('jobs/:id/save')
    @HttpCode(HttpStatus.OK)
    unsave(@CurrentUser() user: User, @Param('id') jobId: string) {
        return this.savedJobsService.unsave(user.id, jobId);
    }
}
