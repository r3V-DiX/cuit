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
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
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

    /** POST /subscriptions/cancel — employer self-cancels their active plan */
    @Post('cancel')
    @HttpCode(HttpStatus.OK)
    cancelMySubscription(@CurrentUser() user: User) {
        return this.subscriptionService.cancelMySubscription(user.id);
    }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

@Controller('subscriptions/admin')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AdminSubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    /** GET /subscriptions/admin — all employer subscriptions */
    @Get()
    @RequirePermission(ACTIONS.SUBSCRIPTION.READ)
    listAll(@Query() query: SubscriptionListQueryDto) {
        return this.subscriptionService.listAll(query);
    }

    /** GET /subscriptions/admin/:id */
    @Get(':id')
    @RequirePermission(ACTIONS.SUBSCRIPTION.READ)
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.subscriptionService.getById(id);
    }

    /** POST /subscriptions/admin/assign — assign or change employer plan */
    @Post('assign')
    @RequirePermission(ACTIONS.SUBSCRIPTION.MANAGE)
    assign(@CurrentUser() user: User, @Body() dto: AssignSubscriptionDto) {
        return this.subscriptionService.assign(dto, user.id);
    }

    /** PATCH /subscriptions/admin/:id/status — manually set status */
    @Patch(':id/status')
    @RequirePermission(ACTIONS.SUBSCRIPTION.MANAGE)
    updateStatus(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubscriptionStatusDto) {
        return this.subscriptionService.updateStatus(id, dto, user.id);
    }

    /** POST /subscriptions/admin/refresh-usage/:employerId — re-sync usage counters */
    @Post('refresh-usage/:employerId')
    @RequirePermission(ACTIONS.SUBSCRIPTION.MANAGE)
    refreshUsage(@CurrentUser() user: User, @Param('employerId', ParseUUIDPipe) employerId: string) {
        return this.subscriptionService.refreshUsage(employerId, user.id);
    }
}
