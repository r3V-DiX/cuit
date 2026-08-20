// admin-app/src/modules/resumes/resumes.controller.ts

import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
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

    // GET /admin/resumes/:id/view — short-lived presigned URL to the file
    @Get(':id/view')
    @RequirePermission(ACTIONS.RESUMES.VIEW)
    getViewUrl(@Param('id', ParseUUIDPipe) id: string) {
        return this.resumesService.getViewUrl(id);
    }
}
