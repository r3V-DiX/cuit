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
import { AuthGuard } from '@cykruit/auth-core';
import { AdminGuard } from '../guards/admin.guard';
import { SubscriptionService } from '../services/subscription.service';
import {
    CreatePackageDto,
    UpdatePackageDto,
    AssignSubscriptionDto,
    SubscriptionListQueryDto,
} from '../dto/subscription.dto';

@Controller('admin/subscriptions')
@UseGuards(AuthGuard, AdminGuard)
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    // ── Packages ──────────────────────────────────────────────────────────────

    @Get('packages')
    listPackages(@Query('isActive') isActive?: string) {
        const filter = isActive !== undefined ? { isActive: isActive === 'true' } : {};
        return this.subscriptionService.listPackages(filter);
    }

    @Get('packages/:id')
    getPackage(@Param('id') id: string) {
        return this.subscriptionService.getPackage(id);
    }

    @Post('packages')
    @HttpCode(HttpStatus.CREATED)
    createPackage(@Body() dto: CreatePackageDto) {
        return this.subscriptionService.createPackage(dto);
    }

    @Patch('packages/:id')
    updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
        return this.subscriptionService.updatePackage(id, dto);
    }

    @Delete('packages/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    deletePackage(@Param('id') id: string) {
        return this.subscriptionService.deletePackage(id);
    }

    // ── Employer subscriptions ────────────────────────────────────────────────

    @Get()
    listSubscriptions(@Query() query: SubscriptionListQueryDto) {
        return this.subscriptionService.listSubscriptions(query);
    }

    @Get(':id')
    getSubscription(@Param('id') id: string) {
        return this.subscriptionService.getSubscriptionById(id);
    }

    @Get('employer/:employerId')
    getEmployerSubscription(@Param('employerId') employerId: string) {
        return this.subscriptionService.getEmployerSubscription(employerId);
    }

    @Post('assign')
    @HttpCode(HttpStatus.OK)
    assignSubscription(@Body() dto: AssignSubscriptionDto) {
        return this.subscriptionService.assignSubscription(dto);
    }

    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.subscriptionService.updateSubscriptionStatus(id, status);
    }
}
