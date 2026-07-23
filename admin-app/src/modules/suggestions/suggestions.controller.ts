// admin-app/src/modules/suggestions/suggestions.controller.ts

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
import { SuggestionsService } from './suggestions.service';
import {
    BulkCreateSuggestionsDto,
    CreateSuggestionDto,
    SuggestionListQueryDto,
    UpdateSuggestionDto,
} from './dto/suggestions.dto';

@Controller('admin/suggestions')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class SuggestionsController {
    constructor(private readonly service: SuggestionsService) {}

    // GET /admin/suggestions
    @Get()
    @RequirePermission(ACTIONS.SUGGESTIONS.VIEW)
    list(@Query() query: SuggestionListQueryDto) {
        return this.service.list(query);
    }

    // POST /admin/suggestions
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.SUGGESTIONS.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: CreateSuggestionDto) {
        return this.service.create(admin.id, dto);
    }

    // POST /admin/suggestions/bulk
    @Post('bulk')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.SUGGESTIONS.MANAGE)
    bulkCreate(@CurrentAdmin() admin: Admin, @Body() dto: BulkCreateSuggestionsDto) {
        return this.service.bulkCreate(admin.id, dto);
    }

    // PATCH /admin/suggestions/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUGGESTIONS.MANAGE)
    update(@CurrentAdmin() admin: Admin, @Param('id') id: string, @Body() dto: UpdateSuggestionDto) {
        return this.service.update(admin.id, id, dto);
    }

    // PATCH /admin/suggestions/:id/toggle
    @Patch(':id/toggle')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUGGESTIONS.MANAGE)
    toggle(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.toggle(admin.id, id);
    }

    // DELETE /admin/suggestions/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.SUGGESTIONS.MANAGE)
    remove(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }
}
