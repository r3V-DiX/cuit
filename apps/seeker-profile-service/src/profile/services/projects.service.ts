// apps/seeker-profile-service/src/profile/services/projects.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { GeneralErrorCodes } from '@cykruit/common';
import { ProfileHelpers } from '../utils/profile.helpers';
import { ValidationHelpers } from '../utils/validation.helpers';
import { PROFILE_LIMITS } from '../utils/constants';
import { CreateProjectDto } from '../dto/projects/create-project.dto';
import { UpdateProjectDto } from '../dto/projects/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService, private readonly helpers: ProfileHelpers) { }

    async getProjects(userId: string) {
        const profileId = await this.helpers.getProfileId(userId);
        const projects = await this.prisma.project.findMany({
            where: { profileId },
            orderBy: [{ current: 'desc' }, { startDate: 'desc' }],
        });
        return { projects, total: projects.length };
    }

    async getProjectById(userId: string, projectId: string) {
        const profileId = await this.helpers.getProfileId(userId);
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
        this.helpers.validateOwnership(project.profileId, profileId, 'project');
        return project;
    }

    async createProject(userId: string, dto: CreateProjectDto) {
        const profileId = await this.helpers.getProfileId(userId);

        await this.helpers.checkItemLimit(profileId, 'project', PROFILE_LIMITS.MAX_PROJECTS, 'projects');

        if (dto.startDate || dto.endDate || dto.current !== undefined) {
            this.validateProjectDates(dto.startDate, dto.endDate, dto.current ?? false);
        }

        await this.prisma.project.create({
            data: {
                profileId,
                title: dto.title,
                description: dto.description,
                technologies: dto.technologies,
                projectUrl: dto.projectUrl,
                startDate: dto.startDate,
                endDate: dto.current ? null : dto.endDate,
                current: dto.current ?? false,
                highlights: dto.highlights || [],
            },
        });

        await this.helpers.updateProfileCompletion(userId);

        return { message: 'Project added successfully' };
    }

    async updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
        const profileId = await this.helpers.getProfileId(userId);
        const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
        this.helpers.validateOwnership(existing.profileId, profileId, 'project');

        if (dto.startDate || dto.endDate !== undefined || dto.current !== undefined) {
            const startDate = dto.startDate || existing.startDate;
            const endDate = dto.endDate !== undefined ? dto.endDate : existing.endDate;
            const current = dto.current !== undefined ? dto.current : existing.current;
            this.validateProjectDates(startDate, endDate, current);
        }

        await this.prisma.project.update({
            where: { id: projectId },
            data: { ...dto, endDate: dto.current ? null : dto.endDate },
        });

        return { message: 'Project updated successfully' };
    }

    async deleteProject(userId: string, projectId: string) {
        const profileId = await this.helpers.getProfileId(userId);
        const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
        this.helpers.validateOwnership(existing.profileId, profileId, 'project');

        await this.prisma.project.delete({ where: { id: projectId } });
        await this.helpers.updateProfileCompletion(userId);

        return { message: 'Project deleted successfully' };
    }

    private validateProjectDates(startDate?: string | null, endDate?: string | null, current = false): void {
        ValidationHelpers.validateCurrentDateLogic(current, endDate, 'project');
        if (!current && startDate && endDate) ValidationHelpers.validateYearMonthRange(startDate, endDate);
        else if (startDate) ValidationHelpers.validateYearMonthFormat(startDate);
    }
}