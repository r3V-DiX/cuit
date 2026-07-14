// apps/subscription-service/src/subscription/controllers/packages.controller.ts

import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';
import { Public } from '@cykruit/auth-core';
import { PackagesService } from '../services/packages.service';

// ── Public ────────────────────────────────────────────────────────────────────

@Controller('subscriptions/packages')
@Public()
export class PublicPackagesController {
    constructor(private readonly packagesService: PackagesService) {}

    @Get()
    listActive() {
        return this.packagesService.listActive();
    }

    @Get(':id')
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.packagesService.getById(id);
    }
}
