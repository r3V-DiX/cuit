// admin-app/src/modules/roles/roles.controller.ts

import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { RolesService } from './roles.service';
import { CreateRoleDto, RoleListQueryDto, UpdateRoleDto } from './dto/roles.dto';

@Controller('admin/roles')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class RolesController {
    constructor(private readonly service: RolesService) {}

    // GET /admin/roles
    @Get()
    @RequirePermission(ACTIONS.ROLES.VIEW)
    list(@Query() query: RoleListQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/roles/:id
    @Get(':id')
    @RequirePermission(ACTIONS.ROLES.VIEW)
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // POST /admin/roles
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.ROLES.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: CreateRoleDto) {
        return this.service.create(admin.id, dto);
    }

    // PATCH /admin/roles/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ROLES.MANAGE)
    update(@CurrentAdmin() admin: Admin, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
        return this.service.update(admin.id, id, dto);
    }

    // PATCH /admin/roles/:id/toggle
    @Patch(':id/toggle')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ROLES.MANAGE)
    toggle(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.toggle(admin.id, id);
    }

    // DELETE /admin/roles/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ROLES.MANAGE)
    remove(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }
}
