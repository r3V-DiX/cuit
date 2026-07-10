// admin-app/src/admin/controllers/testimonials.controller.ts

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
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { ACTIONS } from '../rbac/permissions.registry';
import type { Admin } from '@prisma/client';
import { TestimonialsService } from '../services/testimonials.service';
import {
    AdminTestimonialsQueryDto,
    CreateTestimonialDto,
    UpdateTestimonialDto,
} from '../dto/testimonials.dto';

@Controller('admin/testimonials')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class TestimonialsController {
    constructor(private readonly service: TestimonialsService) {}

    // GET /admin/testimonials
    @Get()
    @RequirePermission(ACTIONS.TESTIMONIALS.VIEW)
    list(@Query() query: AdminTestimonialsQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/testimonials/:id
    @Get(':id')
    @RequirePermission(ACTIONS.TESTIMONIALS.VIEW)
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // POST /admin/testimonials
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.TESTIMONIALS.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: CreateTestimonialDto) {
        return this.service.create(admin.id, dto);
    }

    // PATCH /admin/testimonials/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.TESTIMONIALS.MANAGE)
    update(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: UpdateTestimonialDto,
    ) {
        return this.service.update(admin.id, id, dto);
    }

    // DELETE /admin/testimonials/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.TESTIMONIALS.MANAGE)
    remove(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }

    // PATCH /admin/testimonials/:id/publish
    @Patch(':id/publish')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.TESTIMONIALS.MANAGE)
    publish(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.publish(admin.id, id);
    }

    // PATCH /admin/testimonials/:id/unpublish
    @Patch(':id/unpublish')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.TESTIMONIALS.MANAGE)
    unpublish(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.unpublish(admin.id, id);
    }
}
