// admin-app/src/admin/controllers/kyc.controller.ts

import {
    Controller,
    Get,
    Patch,
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
import { KycService } from '../services/kyc.service';
import { KycListQueryDto, ApproveKycDto, RejectKycDto } from '../dto/kyc.dto';

@Controller('admin/kyc')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class KycController {
    constructor(private readonly kycService: KycService) {}

    // GET /admin/kyc — pending verifications queue (default: PENDING + UNDER_REVIEW)
    @Get()
    @RequirePermission(ACTIONS.KYC.VIEW)
    list(@Query() query: KycListQueryDto) {
        return this.kycService.list(query);
    }

    // GET /admin/kyc/:id
    @Get(':id')
    @RequirePermission(ACTIONS.KYC.VIEW)
    getOne(@Param('id') id: string) {
        return this.kycService.getById(id);
    }

    // PATCH /admin/kyc/:id/approve
    @Patch(':id/approve')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.KYC.REVIEW)
    approve(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: ApproveKycDto,
    ) {
        return this.kycService.approve(id, admin.id, dto);
    }

    // PATCH /admin/kyc/:id/reject
    @Patch(':id/reject')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.KYC.REVIEW)
    reject(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: RejectKycDto,
    ) {
        return this.kycService.reject(id, admin.id, dto);
    }
}
