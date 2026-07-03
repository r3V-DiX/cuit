// apps/seeker-profile-service/src/profile/controllers/projects.controller.ts

import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { SkipRateLimit } from '@cykruit/rate-limit';
import { ProjectsService } from '../services/projects.service';
import { CreateProjectDto } from '../dto/projects/create-project.dto';
import { UpdateProjectDto } from '../dto/projects/update-project.dto';

@Controller('projects')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.SEEKER)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get()
    @SkipRateLimit()
    getProjects(@CurrentUser() user: User) {
        return this.projectsService.getProjects(user.id);
    }

    @Get(':id')
    @SkipRateLimit()
    getProjectById(@CurrentUser() user: User, @Param('id') id: string) {
        return this.projectsService.getProjectById(user.id, id);
    }

    @Post()
    createProject(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
        return this.projectsService.createProject(user.id, dto);
    }

    @Patch(':id')
    updateProject(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
        return this.projectsService.updateProject(user.id, id, dto);
    }

    @Delete(':id')
    deleteProject(@CurrentUser() user: User, @Param('id') id: string) {
        return this.projectsService.deleteProject(user.id, id);
    }
}