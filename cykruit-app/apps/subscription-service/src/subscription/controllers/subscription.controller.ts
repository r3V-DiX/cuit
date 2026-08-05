// apps/subscription-service/src/subscription/controllers/subscription.controller.ts

import {
    Controller,
    Get,
    Post,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard, CsrfGuard, CurrentUser } from '@cykruit/auth-core';
import { SkipRateLimit } from '@cykruit/rate-limit';
import type { User } from '@prisma/client';
import { SubscriptionService } from '../services/subscription.service';

// ── Employer-facing ───────────────────────────────────────────────────────────

@Controller('subscriptions')
@UseGuards(AuthGuard)
export class EmployerSubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    /** GET /subscriptions/my — employer's current plan + limits */
    @Get('my')
    @SkipRateLimit({ global: true })
    getMySubscription(@CurrentUser() user: User) {
        return this.subscriptionService.getMySubscription(user.id);
    }

    /** GET /subscriptions/usage — live usage vs limits */
    @Get('usage')
    getMyUsage(@CurrentUser() user: User) {
        return this.subscriptionService.getMyUsage(user.id);
    }

    /** POST /subscriptions/cancel — employer self-cancels their active plan (cancel-at-period-end) */
    @Post('cancel')
    @UseGuards(CsrfGuard)
    @HttpCode(HttpStatus.OK)
    cancelMySubscription(@CurrentUser() user: User) {
        return this.subscriptionService.cancelMySubscription(user.id);
    }

    /** POST /subscriptions/resume — employer re-activates a cancelled-at-period-end plan */
    @Post('resume')
    @UseGuards(CsrfGuard)
    @HttpCode(HttpStatus.OK)
    resumeMySubscription(@CurrentUser() user: User) {
        return this.subscriptionService.resumeMySubscription(user.id);
    }
}
