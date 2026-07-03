// apps/seeker-profile-service/src/profile/controllers/ctf-profile.controller.ts

import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { SkipRateLimit } from '@cykruit/rate-limit';
import { CTFProfileService } from '../services/ctf-profile.service';
import { CreateCTFProfileDto } from '../dto/ctf/create-ctf-profile.dto';
import { UpdateCTFProfileDto } from '../dto/ctf/update-ctf-profile.dto';

@Controller('ctf-profiles')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.SEEKER)
export class CTFProfileController {
    constructor(private readonly ctfProfileService: CTFProfileService) { }

    @Get()
    @SkipRateLimit()
    getCTFProfiles(@CurrentUser() user: User) {
        return this.ctfProfileService.getCTFProfiles(user.id);
    }

    @Get(':id')
    @SkipRateLimit()
    getCTFProfileById(@CurrentUser() user: User, @Param('id') id: string) {
        return this.ctfProfileService.getCTFProfileById(user.id, id);
    }

    @Post()
    createCTFProfile(@CurrentUser() user: User, @Body() dto: CreateCTFProfileDto) {
        return this.ctfProfileService.createCTFProfile(user.id, dto);
    }

    @Patch(':id')
    updateCTFProfile(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateCTFProfileDto) {
        return this.ctfProfileService.updateCTFProfile(user.id, id, dto);
    }

    @Delete(':id')
    deleteCTFProfile(@CurrentUser() user: User, @Param('id') id: string) {
        return this.ctfProfileService.deleteCTFProfile(user.id, id);
    }
}