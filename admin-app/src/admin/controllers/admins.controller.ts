// admin-app/src/admin/controllers/admins.controller.ts

import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { ACTIONS } from '../rbac/permissions.registry';
import type { Admin } from '@prisma/client';
import { AdminsService } from '../services/admins.service';
import { AdminListQueryDto, InviteAdminDto } from '../dto/admins.dto';

@Controller('admin/admins')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminsController {
    constructor(private readonly service: AdminsService) {}

    // GET /admin/admins
    @Get()
    @RequirePermission(ACTIONS.ADMINS.VIEW)
    list(@Query() query: AdminListQueryDto) {
        return this.service.list(query);
    }

    // POST /admin/admins/invite
    @Post('invite')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.ADMINS.MANAGE)
    invite(@CurrentAdmin() admin: Admin, @Body() dto: InviteAdminDto) {
        return this.service.invite(admin.id, `${admin.firstName} ${admin.lastName}`, dto);
    }

    // DELETE /admin/admins/:id — deactivates (soft), never a hard delete
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ADMINS.MANAGE)
    deactivate(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.service.deactivate(admin.id, id);
    }

    // PATCH /admin/admins/:id/reactivate
    @Patch(':id/reactivate')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ADMINS.MANAGE)
    reactivate(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.service.reactivate(admin.id, id);
    }
}
