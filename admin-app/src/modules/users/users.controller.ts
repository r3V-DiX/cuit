// admin-app/src/admin/controllers/users.controller.ts

import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { UsersService } from './users.service';
import { AdminUserListQueryDto, FlagUserDto, SuspendUserDto, UnsuspendUserDto } from './dto/users.dto';

@Controller('admin/users')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // GET /admin/users
    @Get()
    @RequirePermission(ACTIONS.USERS.VIEW)
    list(@Query() query: AdminUserListQueryDto) {
        return this.usersService.list(query);
    }

    // GET /admin/users/:id
    @Get(':id')
    @RequirePermission(ACTIONS.USERS.VIEW)
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.getById(id);
    }

    // PATCH /admin/users/:id/suspend
    @Patch(':id/suspend')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.SUSPEND)
    suspend(
        @CurrentAdmin() admin: Admin,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SuspendUserDto,
    ) {
        return this.usersService.suspend(id, admin.id, dto);
    }

    // PATCH /admin/users/:id/unsuspend
    @Patch(':id/unsuspend')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.SUSPEND)
    unsuspend(
        @CurrentAdmin() admin: Admin,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UnsuspendUserDto,
    ) {
        return this.usersService.unsuspend(id, admin.id, dto);
    }

    // DELETE /admin/users/:id — soft delete (status = DELETED)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.DELETE)
    delete(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.delete(id, admin.id);
    }

    // PATCH /admin/users/:id/verify-email
    @Patch(':id/verify-email')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.SUSPEND)
    verifyEmail(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.verifyEmail(id, admin.id);
    }

    // PATCH /admin/users/:id/unlock
    @Patch(':id/unlock')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.UNLOCK)
    unlock(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.unlock(id, admin.id);
    }

    // PATCH /admin/users/:id/flag
    @Patch(':id/flag')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.SUSPEND)
    flag(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string, @Body() dto: FlagUserDto) {
        return this.usersService.flag(id, admin.id, dto);
    }

    // PATCH /admin/users/:id/unflag
    @Patch(':id/unflag')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.SUSPEND)
    unflag(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.unflag(id, admin.id);
    }
}
