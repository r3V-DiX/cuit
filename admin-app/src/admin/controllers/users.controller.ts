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
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { ACTIONS } from '../rbac/permissions.registry';
import type { Admin } from '@prisma/client';
import { UsersService } from '../services/users.service';
import { AdminUserListQueryDto, SuspendUserDto, UnsuspendUserDto } from '../dto/users.dto';

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
    getOne(@Param('id') id: string) {
        return this.usersService.getById(id);
    }

    // PATCH /admin/users/:id/suspend
    @Patch(':id/suspend')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.SUSPEND)
    suspend(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
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
        @Param('id') id: string,
        @Body() dto: UnsuspendUserDto,
    ) {
        return this.usersService.unsuspend(id, admin.id, dto);
    }

    // DELETE /admin/users/:id — soft delete (status = DELETED)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.DELETE)
    delete(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.usersService.delete(id, admin.id);
    }

    // PATCH /admin/users/:id/verify-email
    @Patch(':id/verify-email')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.SUSPEND)
    verifyEmail(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.usersService.verifyEmail(id, admin.id);
    }

    // PATCH /admin/users/:id/unlock
    @Patch(':id/unlock')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.USERS.UNLOCK)
    unlock(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.usersService.unlock(id, admin.id);
    }
}
