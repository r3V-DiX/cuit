// admin-app/src/modules/export/export.controller.ts

import { Controller, Get, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { Readable } from 'stream';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import type { Admin } from '@prisma/client';
import { ExportService } from './export.service';
import { ExportApplicationsQueryDto, ExportJobsQueryDto, ExportUsersQueryDto } from './dto/export.dto';

function asCsvFile(csv: string, filename: string): StreamableFile {
    return new StreamableFile(Readable.from([csv]), {
        type: 'text/csv',
        disposition: `attachment; filename="${filename}"`,
    });
}

@Controller('admin/export')
@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermission(ACTIONS.EXPORT.RUN)
export class ExportController {
    constructor(private readonly service: ExportService) {}

    // GET /admin/export/users
    @Get('users')
    async users(@CurrentAdmin() admin: Admin, @Query() query: ExportUsersQueryDto) {
        const csv = await this.service.exportUsers(admin.id, query);
        return asCsvFile(csv, 'users.csv');
    }

    // GET /admin/export/jobs
    @Get('jobs')
    async jobs(@CurrentAdmin() admin: Admin, @Query() query: ExportJobsQueryDto) {
        const csv = await this.service.exportJobs(admin.id, query);
        return asCsvFile(csv, 'jobs.csv');
    }

    // GET /admin/export/applications
    @Get('applications')
    async applications(@CurrentAdmin() admin: Admin, @Query() query: ExportApplicationsQueryDto) {
        const csv = await this.service.exportApplications(admin.id, query);
        return asCsvFile(csv, 'applications.csv');
    }

    // GET /admin/export/subscriptions
    @Get('subscriptions')
    async subscriptions(@CurrentAdmin() admin: Admin) {
        const csv = await this.service.exportSubscriptions(admin.id);
        return asCsvFile(csv, 'subscriptions.csv');
    }
}
