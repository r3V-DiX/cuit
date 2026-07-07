// apps/subscription-service/src/subscription/controllers/subscription.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import type { User } from '@prisma/client';
import { AdminGuard } from '../guards/admin.guard';
import { SubscriptionService } from '../services/subscription.service';
import { AssignSubscriptionDto, UpdateSubscriptionStatusDto } from '../dto/assign.dto';
import { SubscriptionListQueryDto } from '../dto/query.dto';

// ── Employer-facing ───────────────────────────────────────────────────────────

@Controller('subscriptions')
@UseGuards(AuthGuard)
export class EmployerSubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    /** GET /subscriptions/my — employer's current plan + limits */
    @Get('my')
    getMySubscription(@CurrentUser() user: User) {
        return this.subscriptionService.getMySubscription(user.id);
    }

    /** GET /subscriptions/usage — live usage vs limits */
    @Get('usage')
    getMyUsage(@CurrentUser() user: User) {
        return this.subscriptionService.getMyUsage(user.id);
    }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

@Controller('subscriptions/admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminSubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    /** GET /subscriptions/admin — all employer subscriptions */
    @Get()
    listAll(@Query() query: SubscriptionListQueryDto) {
        return this.subscriptionService.listAll(query);
    }

    /** GET /subscriptions/admin/:id */
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.subscriptionService.getById(id);
    }

    /** POST /subscriptions/admin/assign — assign or change employer plan */
    @Post('assign')
    assign(@Body() dto: AssignSubscriptionDto) {
        return this.subscriptionService.assign(dto);
    }

    /** PATCH /subscriptions/admin/:id/status — manually set status */
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateSubscriptionStatusDto) {
        return this.subscriptionService.updateStatus(id, dto);
    }

    /** POST /subscriptions/admin/refresh-usage/:employerId — re-sync usage counters */
    @Post('refresh-usage/:employerId')
    refreshUsage(@Param('employerId') employerId: string) {
        return this.subscriptionService.refreshUsage(employerId);
    }
}
