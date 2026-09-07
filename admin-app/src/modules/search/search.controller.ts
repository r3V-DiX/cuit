// admin-app/src/modules/search/search.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard, CurrentAdmin } from '../auth';
import type { Admin } from '@prisma/client';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search.dto';

@Controller('admin/search')
@UseGuards(AdminAuthGuard)
export class SearchController {
    constructor(private readonly service: SearchService) {}

    // GET /admin/search?q=...
    // No @RequirePermission here — visibility is resolved per-entity inside
    // the service (each admin only sees groups for entities they can view).
    @Get()
    search(@CurrentAdmin() admin: Admin, @Query() query: SearchQueryDto) {
        return this.service.search(admin.id, query.q);
    }
}
