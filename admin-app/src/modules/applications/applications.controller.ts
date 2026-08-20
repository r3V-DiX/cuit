// admin-app/src/modules/applications/applications.controller.ts

import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import { ApplicationsService } from './applications.service';
import { AdminApplicationListQueryDto } from './dto/applications.dto';

@Controller('admin/applications')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class ApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) {}

    // GET /admin/applications — all job applications, paginated + filterable
    @Get()
    @RequirePermission(ACTIONS.APPLICATIONS.VIEW)
    list(@Query() query: AdminApplicationListQueryDto) {
        return this.applicationsService.list(query);
    }

    // GET /admin/applications/:id
    @Get(':id')
    @RequirePermission(ACTIONS.APPLICATIONS.VIEW)
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.applicationsService.getById(id);
    }
}
