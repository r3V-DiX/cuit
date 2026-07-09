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
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { AdminGuard } from '../guards/admin.guard';
import type { User } from '@prisma/client';
import { TestimonialsService } from '../services/testimonials.service';
import {
    AdminTestimonialsQueryDto,
    CreateTestimonialDto,
    UpdateTestimonialDto,
} from '../dto/testimonials.dto';

@Controller('admin/testimonials')
@UseGuards(AuthGuard, AdminGuard)
export class TestimonialsController {
    constructor(private readonly service: TestimonialsService) {}

    // GET /admin/testimonials
    @Get()
    list(@Query() query: AdminTestimonialsQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/testimonials/:id
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // POST /admin/testimonials
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@CurrentUser() admin: User, @Body() dto: CreateTestimonialDto) {
        return this.service.create(admin.id, dto);
    }

    // PATCH /admin/testimonials/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    update(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: UpdateTestimonialDto,
    ) {
        return this.service.update(admin.id, id, dto);
    }

    // DELETE /admin/testimonials/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    remove(@CurrentUser() admin: User, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }

    // PATCH /admin/testimonials/:id/publish
    @Patch(':id/publish')
    @HttpCode(HttpStatus.OK)
    publish(@CurrentUser() admin: User, @Param('id') id: string) {
        return this.service.publish(admin.id, id);
    }

    // PATCH /admin/testimonials/:id/unpublish
    @Patch(':id/unpublish')
    @HttpCode(HttpStatus.OK)
    unpublish(@CurrentUser() admin: User, @Param('id') id: string) {
        return this.service.unpublish(admin.id, id);
    }
}
