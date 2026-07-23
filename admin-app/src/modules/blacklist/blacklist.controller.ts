// admin-app/src/modules/blacklist/blacklist.controller.ts

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { BlacklistService } from './blacklist.service';
import { BlacklistEntryDto, BlacklistListQueryDto, BulkCreateBlacklistDto } from './dto/blacklist.dto';

@Controller('admin/blacklist')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class BlacklistController {
    constructor(private readonly service: BlacklistService) {}

    // GET /admin/blacklist
    @Get()
    @RequirePermission(ACTIONS.BLACKLIST.VIEW)
    list(@Query() query: BlacklistListQueryDto) {
        return this.service.list(query);
    }

    // POST /admin/blacklist
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.BLACKLIST.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: BlacklistEntryDto) {
        return this.service.create(admin.id, dto);
    }

    // POST /admin/blacklist/bulk
    @Post('bulk')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.BLACKLIST.MANAGE)
    bulkCreate(@CurrentAdmin() admin: Admin, @Body() dto: BulkCreateBlacklistDto) {
        return this.service.bulkCreate(admin.id, dto);
    }

    // DELETE /admin/blacklist/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.BLACKLIST.MANAGE)
    remove(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }
}
