// admin-app/src/admin/controllers/discounts.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { DiscountsService } from './discounts.service';
import {
    DiscountListQueryDto,
    CreateDiscountDto,
    UpdateDiscountDto,
    DiscountUsagesQueryDto,
} from './dto/discounts.dto';

@Controller('admin/discounts')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class DiscountsController {
    constructor(private readonly service: DiscountsService) {}

    // GET /admin/discounts
    @Get()
    @RequirePermission(ACTIONS.DISCOUNTS.VIEW)
    list(@Query() query: DiscountListQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/discounts/:id/usages — must come before :id to avoid NestJS swallowing it
    @Get(':id/usages')
    @RequirePermission(ACTIONS.DISCOUNTS.VIEW)
    usages(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: DiscountUsagesQueryDto,
    ) {
        return this.service.getUsages(id, query);
    }

    // GET /admin/discounts/:id
    @Get(':id')
    @RequirePermission(ACTIONS.DISCOUNTS.VIEW)
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.getById(id);
    }

    // POST /admin/discounts
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.DISCOUNTS.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: CreateDiscountDto) {
        return this.service.create(admin.id, dto);
    }

    // PATCH /admin/discounts/:id/deactivate — must come before :id
    @Patch(':id/deactivate')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.DISCOUNTS.MANAGE)
    deactivate(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.service.deactivate(admin.id, id);
    }

    // PATCH /admin/discounts/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.DISCOUNTS.MANAGE)
    update(
        @CurrentAdmin() admin: Admin,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateDiscountDto,
    ) {
        return this.service.update(admin.id, id, dto);
    }
}
