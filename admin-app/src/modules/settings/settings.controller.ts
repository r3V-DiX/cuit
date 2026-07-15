// admin-app/src/admin/controllers/settings.controller.ts

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/settings.dto';

@Controller('admin/settings')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class SettingsController {
    constructor(private readonly service: SettingsService) {}

    // GET /admin/settings
    @Get()
    @RequirePermission(ACTIONS.SETTINGS.VIEW)
    list() {
        return this.service.list();
    }

    // PATCH /admin/settings/:key
    @Patch(':key')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SETTINGS.MANAGE)
    update(
        @CurrentAdmin() admin: Admin,
        @Param('key') key: string,
        @Body() dto: UpdateSettingDto,
    ) {
        return this.service.update(admin.id, key, dto);
    }
}
