// apps/employer-service/src/employer/controllers/admin-kyc.controller.ts

import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard } from '@cykruit/permissions';
import { AdminGuard } from '../guards/admin.guard';
import { AdminKycService } from '../services/admin-kyc.service';
import { AdminKycQueryDto, ApproveKycDto, RejectKycDto } from '../dto/admin-kyc.dto';

@Controller('employer/admin/kyc')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AdminKycController {
    constructor(private readonly adminKycService: AdminKycService) {}

    // ─── GET /employer/admin/kyc ──────────────────────────────────────────────

    @Get()
    listKyc(@Query() query: AdminKycQueryDto) {
        return this.adminKycService.listKyc(query);
    }

    // ─── GET /employer/admin/kyc/:id ──────────────────────────────────────────

    @Get(':id')
    getKyc(@Param('id', ParseUUIDPipe) id: string) {
        return this.adminKycService.getKyc(id);
    }

    // ─── PATCH /employer/admin/kyc/:id/approve ────────────────────────────────

    @Patch(':id/approve')
    approveKyc(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: ApproveKycDto,
        @CurrentUser() user: User,
    ) {
        return this.adminKycService.approveKyc(id, body.adminNotes, user.id);
    }

    // ─── PATCH /employer/admin/kyc/:id/reject ─────────────────────────────────

    @Patch(':id/reject')
    rejectKyc(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: RejectKycDto,
        @CurrentUser() user: User,
    ) {
        return this.adminKycService.rejectKyc(id, body.rejectionReason, body.adminNotes, user.id);
    }
}
