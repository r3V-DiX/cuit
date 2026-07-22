// admin-app/src/modules/policies/policies.controller.ts

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { PoliciesService } from './policies.service';
import { UpdatePolicyDto } from './dto/policies.dto';

@Controller('admin/policies')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class PoliciesController {
    constructor(private readonly service: PoliciesService) {}

    // GET /admin/policies
    @Get()
    @RequirePermission(ACTIONS.POLICIES.VIEW)
    list() {
        return this.service.list();
    }

    // PATCH /admin/policies/:key
    @Patch(':key')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.POLICIES.MANAGE)
    update(
        @CurrentAdmin() admin: Admin,
        @Param('key') key: string,
        @Body() dto: UpdatePolicyDto,
    ) {
        return this.service.update(admin.id, key, dto);
    }

    // POST /admin/policies/reset/:key
    @Post('reset/:key')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.POLICIES.MANAGE)
    reset(@CurrentAdmin() admin: Admin, @Param('key') key: string) {
        return this.service.resetToDefault(admin.id, key);
    }
}
