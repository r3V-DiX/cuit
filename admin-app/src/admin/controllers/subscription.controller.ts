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
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { ACTIONS } from '../rbac/permissions.registry';
import { SubscriptionService } from '../services/subscription.service';
import {
    CreatePackageDto,
    UpdatePackageDto,
    AssignSubscriptionDto,
    SubscriptionListQueryDto,
} from '../dto/subscription.dto';

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

    @Post('assign')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    assignSubscription(@Body() dto: AssignSubscriptionDto) {
        return this.subscriptionService.assignSubscription(dto);
    }

    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUBSCRIPTIONS.MANAGE)
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.subscriptionService.updateSubscriptionStatus(id, status);
    }
}
