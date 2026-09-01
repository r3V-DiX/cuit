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
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { AdminsService } from './admins.service';
import { AdminListQueryDto, InviteAdminDto } from './dto/admins.dto';

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

    // GET /admin/admins/invites
    @Get('invites')
    @RequirePermission(ACTIONS.ADMINS.VIEW)
    listInvites(@Query() query: AdminListQueryDto) {
        return this.service.listInvites(query);
    }

    // DELETE /admin/admins/invites/:id — revokes a pending invite (status -> REVOKED)
    @Delete('invites/:id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ADMINS.MANAGE)
    revokeInvite(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.service.revokeInvite(admin.id, id);
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
