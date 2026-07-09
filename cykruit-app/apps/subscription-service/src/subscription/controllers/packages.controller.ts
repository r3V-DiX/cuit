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
} from '@nestjs/common';
import { AuthGuard, Public } from '@cykruit/auth-core';
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
    getOne(@Param('id') id: string) {
        return this.packagesService.getById(id);
    }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

@Controller('subscriptions/admin/packages')
@UseGuards(AuthGuard, AdminGuard)
export class AdminPackagesController {
    constructor(private readonly packagesService: PackagesService) {}

    @Get()
    listAll(@Query() query: PackageListQueryDto) {
        return this.packagesService.listAll(query);
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.packagesService.getById(id);
    }

    @Post()
    create(@Body() dto: CreatePackageDto) {
        return this.packagesService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
        return this.packagesService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    delete(@Param('id') id: string) {
        return this.packagesService.delete(id);
    }
}
