// apps/seeker-service/src/seeker/controllers/activity.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import type { User } from '@prisma/client';
import { ActivityService } from '../services/activity.service';
import { ActivityQuery } from '../repositories/activity.repository';

@Controller('activity')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles('SEEKER')
export class ActivityController {
    constructor(private readonly activityService: ActivityService) {}

    @Get('auth')
    getAuthLogs(@CurrentUser() user: User, @Query() query: ActivityQuery) {
        return this.activityService.getAuthLogs(user.id, {
            ...query,
            page:  query.page  ? Number(query.page)  : 1,
            limit: query.limit ? Number(query.limit) : 50,
        });
    }
}
