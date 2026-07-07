// admin-app/src/admin/controllers/users.controller.ts

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
import { UsersService } from '../services/users.service';
import { AdminUserListQueryDto, SuspendUserDto, UnsuspendUserDto } from '../dto/users.dto';

@Controller('admin/users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // GET /admin/users
    @Get()
    list(@Query() query: AdminUserListQueryDto) {
        return this.usersService.list(query);
    }

    // GET /admin/users/:id
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.usersService.getById(id);
    }

    // PATCH /admin/users/:id/suspend
    @Patch(':id/suspend')
    @HttpCode(HttpStatus.OK)
    suspend(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: SuspendUserDto,
    ) {
        return this.usersService.suspend(id, admin.id, dto);
    }

    // PATCH /admin/users/:id/unsuspend
    @Patch(':id/unsuspend')
    @HttpCode(HttpStatus.OK)
    unsuspend(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: UnsuspendUserDto,
    ) {
        return this.usersService.unsuspend(id, admin.id, dto);
    }
}
