// admin-app/src/modules/domains/domains.controller.ts

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
import { DomainsService } from './domains.service';
import { CreateDomainDto, DomainListQueryDto, UpdateDomainDto } from './dto/domains.dto';

@Controller('admin/domains')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class DomainsController {
    constructor(private readonly service: DomainsService) {}

    // GET /admin/domains
    @Get()
    @RequirePermission(ACTIONS.DOMAINS.VIEW)
    list(@Query() query: DomainListQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/domains/:id
    @Get(':id')
    @RequirePermission(ACTIONS.DOMAINS.VIEW)
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // POST /admin/domains
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.DOMAINS.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: CreateDomainDto) {
        return this.service.create(admin.id, dto);
    }

    // PATCH /admin/domains/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.DOMAINS.MANAGE)
    update(@CurrentAdmin() admin: Admin, @Param('id') id: string, @Body() dto: UpdateDomainDto) {
        return this.service.update(admin.id, id, dto);
    }

    // PATCH /admin/domains/:id/toggle
    @Patch(':id/toggle')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.DOMAINS.MANAGE)
    toggle(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.toggle(admin.id, id);
    }

    // DELETE /admin/domains/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.DOMAINS.MANAGE)
    remove(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }
}
