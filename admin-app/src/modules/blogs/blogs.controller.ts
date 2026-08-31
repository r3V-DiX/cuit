// admin-app/src/modules/blogs/blogs.controller.ts

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
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { BlogsService } from './blogs.service';
import {
    AdminBlogsQueryDto,
    CreateBlogDto,
    UpdateBlogDto,
} from './dto/blogs.dto';

@Controller('admin/blogs')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class BlogsController {
    constructor(private readonly service: BlogsService) {}

    // GET /admin/blogs
    @Get()
    @RequirePermission(ACTIONS.BLOGS.VIEW)
    list(@Query() query: AdminBlogsQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/blogs/:id
    @Get(':id')
    @RequirePermission(ACTIONS.BLOGS.VIEW)
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // POST /admin/blogs
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.BLOGS.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: CreateBlogDto) {
        return this.service.create(admin.id, dto);
    }

    // PATCH /admin/blogs/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.BLOGS.MANAGE)
    update(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: UpdateBlogDto,
    ) {
        return this.service.update(admin.id, id, dto);
    }

    // DELETE /admin/blogs/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.BLOGS.MANAGE)
    remove(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }

    // PATCH /admin/blogs/:id/publish
    @Patch(':id/publish')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.BLOGS.MANAGE)
    publish(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.publish(admin.id, id);
    }

    // PATCH /admin/blogs/:id/unpublish
    @Patch(':id/unpublish')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.BLOGS.MANAGE)
    unpublish(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.unpublish(admin.id, id);
    }
}
