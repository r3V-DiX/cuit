// apps/subscription-service/src/subscription/controllers/packages.controller.ts

import {
    Controller,
    Get,
    Post,
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
import { AuthGuard, CurrentUser, Public } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import type { User } from '@prisma/client';
import { AdminGuard } from '../guards/admin.guard';
import { PackagesService } from '../services/packages.service';
import { CreatePackageDto, UpdatePackageDto } from '../dto/package.dto';
import { PackageListQueryDto } from '../dto/query.dto';

// ── Public ────────────────────────────────────────────────────────────────────

@Controller('subscriptions/packages')
@Public()
export class PublicPackagesController {
    constructor(private readonly packagesService: PackagesService) {}

    @Get()
    listActive() {
        return this.packagesService.listActive();
    }

    @Get(':id')
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.packagesService.getById(id);
    }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

@Controller('subscriptions/admin/packages')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AdminPackagesController {
    constructor(private readonly packagesService: PackagesService) {}

    @Get()
    @RequirePermission(ACTIONS.SUBSCRIPTION.READ)
    listAll(@Query() query: PackageListQueryDto) {
        return this.packagesService.listAll(query);
    }

    @Get(':id')
    @RequirePermission(ACTIONS.SUBSCRIPTION.READ)
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.packagesService.getById(id);
    }

    @Post()
    @RequirePermission(ACTIONS.SUBSCRIPTION.CREATE_PACKAGE)
    create(@CurrentUser() user: User, @Body() dto: CreatePackageDto) {
        return this.packagesService.create(dto, user.id);
    }

    @Patch(':id')
    @RequirePermission(ACTIONS.SUBSCRIPTION.UPDATE_PACKAGE)
    update(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePackageDto) {
        return this.packagesService.update(id, dto, user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUBSCRIPTION.DELETE_PACKAGE)
    delete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
        return this.packagesService.delete(id, user.id);
    }
}
