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
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { AdminGuard } from '../guards/admin.guard';
import type { User } from '@prisma/client';
import { KycService } from '../services/kyc.service';
import { KycListQueryDto, ApproveKycDto, RejectKycDto } from '../dto/kyc.dto';

@Controller('admin/kyc')
@UseGuards(AuthGuard, AdminGuard)
export class KycController {
    constructor(private readonly kycService: KycService) {}

    // GET /admin/kyc — pending verifications queue (default: PENDING + UNDER_REVIEW)
    @Get()
    list(@Query() query: KycListQueryDto) {
        return this.kycService.list(query);
    }

    // GET /admin/kyc/:id
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.kycService.getById(id);
    }

    // PATCH /admin/kyc/:id/approve
    @Patch(':id/approve')
    @HttpCode(HttpStatus.OK)
    approve(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: ApproveKycDto,
    ) {
        return this.kycService.approve(id, admin.id, dto);
    }

    // PATCH /admin/kyc/:id/reject
    @Patch(':id/reject')
    @HttpCode(HttpStatus.OK)
    reject(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: RejectKycDto,
    ) {
        return this.kycService.reject(id, admin.id, dto);
    }
}
