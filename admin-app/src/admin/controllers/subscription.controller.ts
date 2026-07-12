// admin-app/src/admin/controllers/subscription.controller.ts
// Thin controller — all logic lives in subscription-service (:4008).

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
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { ACTIONS } from '../rbac/permissions.registry';
import type { Admin } from '@prisma/client';
import { SubscriptionService } from '../services/subscription.service';
import {
    CreatePackageDto,
    UpdatePackageDto,
    AssignSubscriptionDto,
    SubscriptionListQueryDto,
} from '../dto/subscription.dto';
import { UpdateSubscriptionStatusDto } from '../dto/update-subscription-status.dto';

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
    getPackage(@Param('id') id: string) {
        return this.subscriptionService.getPackage(id);
    }

    @Post('packages')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    createPackage(@Body() dto: CreatePackageDto) {
        return this.subscriptionService.createPackage(dto);
    }

    @Patch('packages/:id')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
        return this.subscriptionService.updatePackage(id, dto);
    }

    @Delete('packages/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    deletePackage(@Param('id') id: string) {
        return this.subscriptionService.deletePackage(id);
    }

    // ── Employer subscriptions ────────────────────────────────────────────────

    @Get()
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    listSubscriptions(@Query() query: SubscriptionListQueryDto) {
        return this.subscriptionService.listSubscriptions(query);
    }

    @Get(':id')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    getSubscription(@Param('id') id: string) {
        return this.subscriptionService.getSubscriptionById(id);
    }

    @Get('employer/:employerId')
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.VIEW)
    getEmployerSubscription(@Param('employerId') employerId: string) {
        return this.subscriptionService.getEmployerSubscription(employerId);
    }

    @Post('employer/:employerId/refresh-usage')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    refreshUsage(@CurrentAdmin() admin: Admin, @Param('employerId') employerId: string) {
        return this.subscriptionService.refreshUsage(admin.id, employerId);
    }

    // ── Payment orders ────────────────────────────────────────────────────────

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
    getPaymentOrder(@Param('id') id: string) {
        return this.subscriptionService.getPaymentOrder(id);
    }

    @Post('assign')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    assignSubscription(@CurrentAdmin() admin: Admin, @Body() dto: AssignSubscriptionDto) {
        return this.subscriptionService.assignSubscription(admin.id, dto);
    }

    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    updateStatus(@CurrentAdmin() admin: Admin, @Param('id') id: string, @Body() dto: UpdateSubscriptionStatusDto) {
        return this.subscriptionService.updateSubscriptionStatus(admin.id, id, dto.status);
    }
}
