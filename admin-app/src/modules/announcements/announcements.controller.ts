// admin-app/src/modules/announcements/announcements.controller.ts

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
import { AnnouncementsService } from './announcements.service';
import { AnnouncementListQueryDto, CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcements.dto';

@Controller('admin/announcements')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AnnouncementsController {
    constructor(private readonly service: AnnouncementsService) {}

    // GET /admin/announcements
    @Get()
    @RequirePermission(ACTIONS.ANNOUNCEMENTS.VIEW)
    list(@Query() query: AnnouncementListQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/announcements/:id
    @Get(':id')
    @RequirePermission(ACTIONS.ANNOUNCEMENTS.VIEW)
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // POST /admin/announcements
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.ANNOUNCEMENTS.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: CreateAnnouncementDto) {
        return this.service.create(admin.id, dto);
    }

    // PATCH /admin/announcements/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ANNOUNCEMENTS.MANAGE)
    update(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: UpdateAnnouncementDto,
    ) {
        return this.service.update(admin.id, id, dto);
    }

    // PATCH /admin/announcements/:id/toggle
    @Patch(':id/toggle')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ANNOUNCEMENTS.MANAGE)
    toggle(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.toggle(admin.id, id);
    }

    // DELETE /admin/announcements/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ANNOUNCEMENTS.MANAGE)
    remove(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }
}
