// admin-app/src/admin/controllers/subscription.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { SubscriptionService } from './subscription.service';
import {
    CreatePackageDto,
    UpdatePackageDto,
    AssignSubscriptionDto,
    SubscriptionListQueryDto,
} from './dto/subscription.dto';
import { UpdateSubscriptionStatusDto } from './dto/update-subscription-status.dto';

@Controller('admin/subscriptions')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    // ── Packages ──────────────────────────────────────────────────────────────

    @Get('packages')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    listPackages(@Query('isActive') isActive?: string) {
        const filter = isActive !== undefined ? { isActive: isActive === 'true' } : {};
        return this.subscriptionService.listPackages(filter);
    }

    @Get('packages/:id')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    getPackage(@Param('id', ParseUUIDPipe) id: string) {
        return this.subscriptionService.getPackage(id);
    }

    @Post('packages')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    createPackage(@CurrentAdmin() admin: Admin, @Body() dto: CreatePackageDto) {
        return this.subscriptionService.createPackage(admin.id, dto);
    }

    @Patch('packages/:id')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    updatePackage(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePackageDto) {
        return this.subscriptionService.updatePackage(admin.id, id, dto);
    }

    @Delete('packages/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    deletePackage(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.subscriptionService.deletePackage(admin.id, id);
    }

    // ── Employer subscriptions ────────────────────────────────────────────────
    // IMPORTANT: static routes must come before /:id to avoid NestJS param capture

    @Get('employer/:employerId')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    getEmployerSubscription(@Param('employerId', ParseUUIDPipe) employerId: string) {
        return this.subscriptionService.getEmployerSubscription(employerId);
    }

    @Post('employer/:employerId/refresh-usage')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    refreshUsage(@CurrentAdmin() admin: Admin, @Param('employerId', ParseUUIDPipe) employerId: string) {
        return this.subscriptionService.refreshUsage(admin.id, employerId);
    }

    @Get('payment-orders')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    listPaymentOrders(
        @Query('employerId') employerId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.subscriptionService.listPaymentOrders({
            employerId,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }

    @Get('payment-orders/:id')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    getPaymentOrder(@Param('id', ParseUUIDPipe) id: string) {
        return this.subscriptionService.getPaymentOrder(id);
    }

    @Post('assign')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    assignSubscription(@CurrentAdmin() admin: Admin, @Body() dto: AssignSubscriptionDto) {
        return this.subscriptionService.assignSubscription(admin.id, dto);
    }

    @Get()
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    listSubscriptions(@Query() query: SubscriptionListQueryDto) {
        return this.subscriptionService.listSubscriptions(query);
    }

    @Get(':id')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    getSubscription(@Param('id', ParseUUIDPipe) id: string) {
        return this.subscriptionService.getSubscriptionById(id);
    }

    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    updateStatus(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubscriptionStatusDto) {
        return this.subscriptionService.updateSubscriptionStatus(admin.id, id, dto.status);
    }
}
