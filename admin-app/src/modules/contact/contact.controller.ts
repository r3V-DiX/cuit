// admin-app/src/admin/controllers/contact.controller.ts

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { ContactService } from './contact.service';
import { ContactListQueryDto, UpdateContactStatusDto } from './dto/contact.dto';

@Controller('admin/contact')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class ContactController {
    constructor(private readonly service: ContactService) {}

    // GET /admin/contact
    @Get()
    @RequirePermission(ACTIONS.CONTACT.VIEW)
    list(@Query() query: ContactListQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/contact/:id
    @Get(':id')
    @RequirePermission(ACTIONS.CONTACT.VIEW)
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // PATCH /admin/contact/:id/status
    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.CONTACT.MANAGE)
    updateStatus(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: UpdateContactStatusDto,
    ) {
        return this.service.updateStatus(admin.id, id, dto);
    }
}
