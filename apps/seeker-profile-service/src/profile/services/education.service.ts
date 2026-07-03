// apps/seeker-profile-service/src/profile/services/education.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { GeneralErrorCodes } from '@cykruit/common';
import { ProfileHelpers } from '../utils/profile.helpers';
import { ValidationHelpers } from '../utils/validation.helpers';
import { PROFILE_LIMITS } from '../utils/constants';
import { CreateEducationDto } from '../dto/education/create-education.dto';
import { UpdateEducationDto } from '../dto/education/update-education.dto';
import { SearchInstitutesDto } from '../dto/education/search-institutes.dto';

@Injectable()
export class EducationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly helpers: ProfileHelpers,
    ) {}

    async getEducation(userId: string) {
        const profileId = await this.helpers.getProfileId(userId);
        const education = await this.prisma.education.findMany({
            where: { profileId },
            include: { institute: true },
            orderBy: { endDate: 'desc' },
        });
        return { education, total: education.length };
    }

    async getEducationById(userId: string, educationId: string) {
        const profileId = await this.helpers.getProfileId(userId);
        const education = await this.prisma.education.findUnique({
            where: { id: educationId },
            include: { institute: true },
        });
        if (!education) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
        this.helpers.validateOwnership(education.profileId, profileId, 'education record');
        return education;
    }

    async createEducation(userId: string, dto: CreateEducationDto) {
        const profileId = await this.helpers.getProfileId(userId);

        await this.helpers.checkItemLimit(profileId, 'education', PROFILE_LIMITS.MAX_EDUCATION, 'education records');

        // Must provide exactly one of instituteId or instituteName
        if (!dto.instituteId && !dto.instituteName) {
            throw new BadRequestException('Provide either instituteId (existing college) or instituteName (custom college)');
        }
        if (dto.instituteId && dto.instituteName) {
            throw new BadRequestException('Provide either instituteId or instituteName, not both');
        }

        let resolvedInstituteId: string | null = null;
        const resolvedInstituteName: string | null = null;

        if (dto.instituteId) {
            // Predefined institute — validate it exists
            await this.helpers.validateEntityExists('institute', dto.instituteId, 'Invalid institute ID');
            resolvedInstituteId = dto.instituteId;
        } else {
            // Custom institute — save it to institutes table as unverified
            // so admin can review it later, and link it to the education record
            const existing = await this.prisma.institute.findFirst({
                where: { name: { equals: dto.instituteName, mode: 'insensitive' } },
            });

            if (existing) {
                // Already in DB (maybe another user added the same college before)
                resolvedInstituteId = existing.id;
            } else {
                // Brand new custom college — create it as unverified for admin review
                const created = await this.prisma.institute.create({
                    data: {
                        name: dto.instituteName!,
                        isVerified: false, // Admin will verify later
                    },
                });
                resolvedInstituteId = created.id;
            }
        }

        if (dto.startDate && dto.endDate) {
            ValidationHelpers.validateYearRange(dto.startDate, dto.endDate);
        }

        await this.prisma.education.create({
            data: {
                profileId,
                degree: dto.degree,
                fieldOfStudy: dto.fieldOfStudy,
                instituteId: resolvedInstituteId,
                instituteName: resolvedInstituteName, // null — we always use instituteId now
                startDate: dto.startDate,
                endDate: dto.endDate,
                grade: dto.grade,
                description: dto.description,
            },
        });

        await this.helpers.updateProfileCompletion(userId);

        return { message: 'Education record added successfully' };
    }

    async updateEducation(userId: string, educationId: string, dto: UpdateEducationDto) {
        const profileId = await this.helpers.getProfileId(userId);

        const existing = await this.prisma.education.findUnique({ where: { id: educationId } });
        if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
        this.helpers.validateOwnership(existing.profileId, profileId, 'education record');

        // Can't set both at the same time
        if (dto.instituteId && dto.instituteName) {
            throw new BadRequestException('Provide either instituteId or instituteName, not both');
        }

        let resolvedInstituteId: string | undefined = undefined;

        if (dto.instituteId) {
            // Switching to a predefined institute
            await this.helpers.validateEntityExists('institute', dto.instituteId, 'Invalid institute ID');
            resolvedInstituteId = dto.instituteId;
        } else if (dto.instituteName) {
            // Switching to a custom institute name
            const existingInstitute = await this.prisma.institute.findFirst({
                where: { name: { equals: dto.instituteName, mode: 'insensitive' } },
            });

            if (existingInstitute) {
                resolvedInstituteId = existingInstitute.id;
            } else {
                const created = await this.prisma.institute.create({
                    data: {
                        name: dto.instituteName,
                        isVerified: false,
                    },
                });
                resolvedInstituteId = created.id;
            }
        }

        if (dto.startDate || dto.endDate) {
            ValidationHelpers.validateOptionalYearRange(
                dto.startDate || existing.startDate,
                dto.endDate || existing.endDate,
            );
        }

        await this.prisma.education.update({
            where: { id: educationId },
            data: {
                ...(dto.degree && { degree: dto.degree }),
                ...(dto.fieldOfStudy !== undefined && { fieldOfStudy: dto.fieldOfStudy }),
                ...(resolvedInstituteId !== undefined && { instituteId: resolvedInstituteId }),
                ...(dto.startDate && { startDate: dto.startDate }),
                ...(dto.endDate !== undefined && { endDate: dto.endDate }),
                ...(dto.grade !== undefined && { grade: dto.grade }),
                ...(dto.description !== undefined && { description: dto.description }),
            },
        });

        return { message: 'Education record updated successfully' };
    }

    async deleteEducation(userId: string, educationId: string) {
        const profileId = await this.helpers.getProfileId(userId);

        const existing = await this.prisma.education.findUnique({ where: { id: educationId } });
        if (!existing) throw new NotFoundException(GeneralErrorCodes.NOT_FOUND);
        this.helpers.validateOwnership(existing.profileId, profileId, 'education record');

        await this.prisma.education.delete({ where: { id: educationId } });
        await this.helpers.updateProfileCompletion(userId);

        return { message: 'Education record deleted successfully' };
    }

    async searchInstitutes(dto: SearchInstitutesDto) {
        const { query, country, limit = 10 } = dto;
        const takeLimit = Number(limit) || 10;

        const institutes = await this.prisma.institute.findMany({
            where: {
                ...(query?.trim() ? { name: { contains: query, mode: 'insensitive' } } : {}),
                ...(country ? { country } : {}),
            },
            take: takeLimit,
            orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
        });

        // Always let the frontend show "Add your college" option —
        // the seeker may not find their college even if results are returned
        return { institutes, total: institutes.length, canAddCustom: true };
    }
}