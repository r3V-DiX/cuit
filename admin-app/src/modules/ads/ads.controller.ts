// admin-app/src/modules/ads/ads.controller.ts

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
import { AdsService } from './ads.service';
import { AdminAdsQueryDto, CreateAdDto, UpdateAdDto } from './dto/ads.dto';

@Controller('admin/ads')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdsController {
    constructor(private readonly service: AdsService) {}

    // GET /admin/ads
    @Get()
    @RequirePermission(ACTIONS.ADS.VIEW)
    list(@Query() query: AdminAdsQueryDto) {
        return this.service.list(query);
    }

    // GET /admin/ads/:id
    @Get(':id')
    @RequirePermission(ACTIONS.ADS.VIEW)
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    // POST /admin/ads
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.ADS.MANAGE)
    create(@CurrentAdmin() admin: Admin, @Body() dto: CreateAdDto) {
        return this.service.create(admin.id, dto);
    }

    // POST /admin/ads/upload
    @Post('upload')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.ADS.MANAGE)
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

    // PATCH /admin/ads/:id
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ADS.MANAGE)
    update(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: UpdateAdDto,
    ) {
        return this.service.update(admin.id, id, dto);
    }

    // DELETE /admin/ads/:id
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ADS.MANAGE)
    remove(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.delete(admin.id, id);
    }

    // PATCH /admin/ads/:id/activate
    @Patch(':id/activate')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ADS.MANAGE)
    activate(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.activate(admin.id, id);
    }

    // PATCH /admin/ads/:id/deactivate
    @Patch(':id/deactivate')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.ADS.MANAGE)
    deactivate(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.service.deactivate(admin.id, id);
    }
}
