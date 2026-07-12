// apps/auth-service/src/auth/controllers/admin-users.controller.ts

import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import type { User } from '@prisma/client';
import { AdminGuard } from '../guards/admin.guard';
import { AdminUsersService } from '../services/admin-users.service';
import { AdminUserQueryDto } from '../dto/admin-users.dto';

@ApiTags('Admin — Users')
@Controller('auth/admin/users')
@UseGuards(AuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all users with optional filters and pagination' })
  async listUsers(@Query() query: AdminUserQueryDto) {
    return this.adminUsersService.listUsers(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single user by ID' })
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsersService.getUser(id);
  }

  @Patch(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a user account' })
  async suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: User,
  ) {
    await this.adminUsersService.suspendUser(id, actor.id);
    return { message: 'User suspended successfully' };
  }

  @Patch(':id/unsuspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsuspend a user account' })
  async unsuspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: User,
  ) {
    await this.adminUsersService.unsuspendUser(id, actor.id);
    return { message: 'User unsuspended successfully' };
  }
}
