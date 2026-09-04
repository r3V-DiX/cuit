// admin-app/src/modules/events/events.controller.ts

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
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { EventsService } from './events.service';
import {
    AdminEventsQueryDto,
    CreateEventDto,
    UpdateEventDto,
} from './dto/events.dto';

@Controller('admin/events')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class EventsController {
    constructor(private readonly service: EventsService) {}

    // GET /admin/events
    @Get()
    @RequirePermission(ACTIONS.EVENTS.VIEW)
    list(@Query() query: AdminEventsQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/events/:id
    @Get(':id')
    @RequirePermission(ACTIONS.EVENTS.VIEW)
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // POST /admin/events
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.EVENTS.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: CreateEventDto) {
        return this.service.create(admin.id, dto);
    }

    // POST /admin/events/upload
    @Post('upload')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.EVENTS.MANAGE)
    @UseInterceptors(FileInterceptor('file'))
    uploadImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        return this.service.uploadImage(file);
    }

    // PATCH /admin/events/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.EVENTS.MANAGE)
    update(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: UpdateEventDto,
    ) {
        return this.service.update(admin.id, id, dto);
    }

    // DELETE /admin/events/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.EVENTS.MANAGE)
    remove(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }

    // PATCH /admin/events/:id/publish
    @Patch(':id/publish')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.EVENTS.MANAGE)
    publish(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.publish(admin.id, id);
    }

    // PATCH /admin/events/:id/unpublish
    @Patch(':id/unpublish')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.EVENTS.MANAGE)
    unpublish(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.unpublish(admin.id, id);
    }
}
