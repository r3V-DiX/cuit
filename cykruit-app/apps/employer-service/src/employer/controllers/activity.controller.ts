import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { SkipRateLimit } from '@cykruit/rate-limit';
import { ActivityService } from '../services/activity.service';
import { ActivityQuery } from '../repositories/activity.repository';

@Controller('employer/activity')
@UseGuards(AuthGuard)
export class ActivityController {
    constructor(private readonly activityService: ActivityService) {}

    @Get('system')
    @SkipRateLimit({ global: true })
    getSystemLogs(@CurrentUser() user: User, @Query() query: ActivityQuery) {
        return this.activityService.getSystemLogs(user.id, {
            ...query,
            page:  query.page  ? Number(query.page)  : 1,
            limit: query.limit ? Number(query.limit) : 50,
        });
    }

    @Get('auth')
    @SkipRateLimit({ global: true })
    getAuthLogs(@CurrentUser() user: User, @Query() query: ActivityQuery) {
        return this.activityService.getAuthLogs(user.id, {
            ...query,
            page:  query.page  ? Number(query.page)  : 1,
            limit: query.limit ? Number(query.limit) : 50,
        });
    }
}
