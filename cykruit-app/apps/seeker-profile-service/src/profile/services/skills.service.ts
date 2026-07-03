// apps/seeker-profile-service/src/profile/services/skills.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { GeneralErrorCodes } from '@cykruit/common';
import { ProfileHelpers } from '../utils/profile.helpers';
import { PROFILE_LIMITS } from '../utils/constants';
import { AddSkillDto } from '../dto/skills/add-skill.dto';
import { UpdateSkillDto } from '../dto/skills/update-skill.dto';
import { SearchSkillsDto } from '../dto/skills/search-skills.dto';

@Injectable()
export class SkillsService {
    constructor(private readonly prisma: PrismaService, private readonly helpers: ProfileHelpers) { }

    async getSkills(userId: string) {
        const profileId = await this.helpers.getProfileId(userId);
        const skills = await this.prisma.jobSeekerSkill.findMany({
            where: { profileId },
            include: { skill: { include: { category: true } } },
            orderBy: { addedAt: 'desc' },
        });
        return { skills, total: skills.length };
    }

    async getSkillById(userId: string, skillId: string) {
        const profileId = await this.helpers.getProfileId(userId);
        const skill = await this.prisma.jobSeekerSkill.findUnique({
            where: { id: skillId },
            include: { skill: { include: { category: true } } },
        });
        if (!skill) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
        this.helpers.validateOwnership(skill.profileId, profileId, 'skill');
        return skill;
    }

    async addSkill(userId: string, dto: AddSkillDto) {
        const profileId = await this.helpers.getProfileId(userId);

        await this.helpers.checkItemLimit(profileId, 'jobSeekerSkill', PROFILE_LIMITS.MAX_SKILLS, 'skills');
        await this.helpers.validateEntityExists('skill', dto.skillId, 'Invalid skill ID');
        await this.helpers.checkUniqueConstraint(
            'jobSeekerSkill',
            { profileId_skillId: { profileId, skillId: dto.skillId } },
            'You have already added this skill',
        );

        const skill = await this.prisma.jobSeekerSkill.create({
            data: { profileId, skillId: dto.skillId, proficiency: dto.proficiency, yearsOfExperience: dto.yearsOfExperience },
            include: { skill: true },
        });

        await this.helpers.updateProfileCompletion(userId);

        return { message: `${skill.skill.name} added successfully` };
    }

    async updateSkill(userId: string, skillId: string, dto: UpdateSkillDto) {
        const profileId = await this.helpers.getProfileId(userId);
        const existing = await this.prisma.jobSeekerSkill.findUnique({
            where: { id: skillId },
            include: { skill: true },
        });
        if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
        this.helpers.validateOwnership(existing.profileId, profileId, 'skill');

        await this.prisma.jobSeekerSkill.update({
            where: { id: skillId },
            data: dto,
        });

        return { message: `${existing.skill.name} updated successfully` };
    }

    async deleteSkill(userId: string, skillId: string) {
        const profileId = await this.helpers.getProfileId(userId);
        const existing = await this.prisma.jobSeekerSkill.findUnique({
            where: { id: skillId },
            include: { skill: true },
        });
        if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
        this.helpers.validateOwnership(existing.profileId, profileId, 'skill');

        await this.prisma.jobSeekerSkill.delete({ where: { id: skillId } });
        await this.helpers.updateProfileCompletion(userId);

        return { message: `${existing.skill.name} deleted successfully` };
    }

    async searchSkills(dto: SearchSkillsDto) {
        const { query, category, limit = 20 } = dto;
        const skills = await this.prisma.skill.findMany({
            where: {
                ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
                ...(category ? { categoryId: category } : {}),
            },
            include: { category: true },
            take: Number(limit) || 20,
            orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
        });
        return { skills, total: skills.length };
    }

    async getSkillCategories() {
        const categories = await this.prisma.skillCategory.findMany({ orderBy: { name: 'asc' } });
        return { categories, total: categories.length };
    }
}