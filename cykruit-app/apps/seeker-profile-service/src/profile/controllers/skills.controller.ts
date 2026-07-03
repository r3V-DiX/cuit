// apps/seeker-profile-service/src/profile/controllers/skills.controller.ts

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { SkipRateLimit } from '@cykruit/rate-limit';
import { SkillsService } from '../services/skills.service';
import { AddSkillDto } from '../dto/skills/add-skill.dto';
import { UpdateSkillDto } from '../dto/skills/update-skill.dto';
import { SearchSkillsDto } from '../dto/skills/search-skills.dto';

@Controller('skills')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.SEEKER)
export class SkillsController {
    constructor(private readonly skillsService: SkillsService) { }

    @Get()
    @SkipRateLimit()
    getSkills(@CurrentUser() user: User) {
        return this.skillsService.getSkills(user.id);
    }

    @Get('search')
    @SkipRateLimit()
    searchSkills(@Query() dto: SearchSkillsDto) {
        return this.skillsService.searchSkills(dto);
    }

    @Get('categories')
    @SkipRateLimit()
    getSkillCategories() {
        return this.skillsService.getSkillCategories();
    }

    @Get(':id')
    @SkipRateLimit()
    getSkillById(@CurrentUser() user: User, @Param('id') id: string) {
        return this.skillsService.getSkillById(user.id, id);
    }

    @Post()
    addSkill(@CurrentUser() user: User, @Body() dto: AddSkillDto) {
        return this.skillsService.addSkill(user.id, dto);
    }

    @Patch(':id')
    updateSkill(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateSkillDto) {
        return this.skillsService.updateSkill(user.id, id, dto);
    }

    @Delete(':id')
    deleteSkill(@CurrentUser() user: User, @Param('id') id: string) {
        return this.skillsService.deleteSkill(user.id, id);
    }
}