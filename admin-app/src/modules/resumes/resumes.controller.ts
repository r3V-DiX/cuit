// admin-app/src/modules/resumes/resumes.controller.ts

import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe, StreamableFile } from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import { ResumesService } from './resumes.service';
import { AdminResumeListQueryDto } from './dto/resumes.dto';

@Controller('admin/resumes')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class ResumesController {
    constructor(private readonly resumesService: ResumesService) {}

    // GET /admin/resumes — resume library, paginated + searchable
    @Get()
    @RequirePermission(ACTIONS.RESUMES.VIEW)
    list(@Query() query: AdminResumeListQueryDto) {
        return this.resumesService.list(query);
    }

    // GET /admin/resumes/:id/view — streams the file directly
    @Get(':id/view')
    @RequirePermission(ACTIONS.RESUMES.VIEW)
    view(@Param('id', ParseUUIDPipe) id: string): Promise<StreamableFile> {
        return this.resumesService.getFileStream(id);
    }
}
