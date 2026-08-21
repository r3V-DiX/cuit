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
    ParseUUIDPipe,
    StreamableFile,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { KycService } from './kyc.service';
import { KycListQueryDto, ApproveKycDto, RejectKycDto } from './dto/kyc.dto';

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
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.kycService.getById(id);
    }

    // GET /admin/kyc/:id/document — streams the uploaded document directly
    @Get(':id/document')
    @RequirePermission(ACTIONS.KYC.VIEW)
    viewDocument(@Param('id', ParseUUIDPipe) id: string): Promise<StreamableFile> {
        return this.kycService.getDocumentStream(id);
    }

    // PATCH /admin/kyc/:id/approve
    @Patch(':id/approve')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.KYC.REVIEW)
    approve(
        @CurrentAdmin() admin: Admin,
        @Param('id', ParseUUIDPipe) id: string,
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
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RejectKycDto,
    ) {
        return this.kycService.reject(id, admin.id, dto);
    }
}
