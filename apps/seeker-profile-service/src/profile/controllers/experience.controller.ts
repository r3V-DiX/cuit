// apps/seeker-profile-service/src/profile/controllers/experience.controller.ts

import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { SkipRateLimit } from '@cykruit/rate-limit';
import { ExperienceService } from '../services/experience.service';
import { CreateExperienceDto } from '../dto/experience/create-experience.dto';
import { UpdateExperienceDto } from '../dto/experience/update-experience.dto';

@Controller('experiences')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.SEEKER)
export class ExperienceController {
    constructor(private readonly experienceService: ExperienceService) { }

    @Get()
    @SkipRateLimit()
    getExperiences(@CurrentUser() user: User) {
        return this.experienceService.getExperiences(user.id);
    }

    @Get(':id')
    @SkipRateLimit()
    getExperienceById(@CurrentUser() user: User, @Param('id') id: string) {
        return this.experienceService.getExperienceById(user.id, id);
    }

    @Post()
    createExperience(@CurrentUser() user: User, @Body() dto: CreateExperienceDto) {
        return this.experienceService.createExperience(user.id, dto);
    }

    @Patch(':id')
    updateExperience(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateExperienceDto) {
        return this.experienceService.updateExperience(user.id, id, dto);
    }

    @Delete(':id')
    deleteExperience(@CurrentUser() user: User, @Param('id') id: string) {
        return this.experienceService.deleteExperience(user.id, id);
    }
}