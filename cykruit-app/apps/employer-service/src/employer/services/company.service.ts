// apps/employer-service/src/employer/services/company.service.ts

import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { EmployerMemberRole } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';
import { UploadService, UPLOAD_CONFIGS } from '@cykruit/upload';
import { EmployerCompletionService, CompanyErrorCodes } from '@cykruit/common';
import { CompanyRepository } from '../repositories/company.repository';
import {
    CreateCompanyDto,
    UpdateCompanyBasicDto,
    UpdateCompanyAboutDto,
    UpdateCompanySocialDto,
    AddOfficeLocationDto,
    AddCompanyBenefitDto,
} from '../dto/company.dto';

@Injectable()
export class CompanyService {
    constructor(
        private readonly companyRepository: CompanyRepository,
        private readonly completionService: EmployerCompletionService,
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) { }

    async getMyCompany(userId: string) {
        const employer = await this.companyRepository.findByMemberId(userId);
        if (!employer) {
            throw new NotFoundException(CompanyErrorCodes.COMPANY_NOT_FOUND);
        }
        return employer;
    }

    async setupCompany(userId: string, dto: CreateCompanyDto) {
        const existing = await this.companyRepository.findByMemberId(userId);
        if (existing) {
            throw new ConflictException(CompanyErrorCodes.INVALID_COMPANY_DATA);
        }

        const slug = await this.generateUniqueSlug(dto.companyName);

        const employer = await this.companyRepository.create(userId, {
            companyName: dto.companyName,
            companyType: dto.companyType,
            industry: dto.industry,
            companySize: dto.companySize,
            location: dto.location,
            slug,
            ...(dto.companyWebsite ? { companyWebsite: dto.companyWebsite } : {}),
            ...(dto.contactEmail ? { contactEmail: dto.contactEmail } : {}),
        });

        await this.companyRepository.addMember(employer.id, userId, EmployerMemberRole.OWNER);

        const completion = await this.completionService.calculateCompletion(employer.id);
        await this.companyRepository.updateCompletion(employer.id, completion.percentage);

        return { ...employer, profileCompletion: completion.percentage };
    }

    async updateBasic(userId: string, dto: UpdateCompanyBasicDto) {
        const employer = await this.getMyCompany(userId);

        const updateData: Record<string, any> = {};
        if (dto.companyName !== undefined) updateData.companyName = dto.companyName;
        if (dto.companyType !== undefined) updateData.companyType = dto.companyType;
        if (dto.industry !== undefined) updateData.industry = dto.industry;
        if (dto.companySize !== undefined) updateData.companySize = dto.companySize;
        if (dto.location !== undefined) updateData.location = dto.location;
        if (dto.companyWebsite !== undefined) updateData.companyWebsite = dto.companyWebsite;
        if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail;
        if (dto.foundedYear !== undefined) updateData.foundedYear = dto.foundedYear;
        if (dto.tagline !== undefined) updateData.tagline = dto.tagline;

        const updated = await this.companyRepository.update(employer.id, updateData);

        const completion = await this.completionService.calculateCompletion(employer.id);
        await this.companyRepository.updateCompletion(employer.id, completion.percentage);

        return { ...updated, profileCompletion: completion.percentage };
    }

    async updateAbout(userId: string, dto: UpdateCompanyAboutDto) {
        const employer = await this.getMyCompany(userId);

        const updateData: Record<string, any> = {};
        if (dto.about !== undefined) updateData.about = dto.about;
        if (dto.mission !== undefined) updateData.mission = dto.mission;
        if (dto.vision !== undefined) updateData.vision = dto.vision;
        if (dto.cultureDescription !== undefined) updateData.cultureDescription = dto.cultureDescription;

        const updated = await this.companyRepository.update(employer.id, updateData);

        const completion = await this.completionService.calculateCompletion(employer.id);
        await this.companyRepository.updateCompletion(employer.id, completion.percentage);

        return { ...updated, profileCompletion: completion.percentage };
    }

    async updateSocial(userId: string, dto: UpdateCompanySocialDto) {
        const employer = await this.getMyCompany(userId);

        const updateData: Record<string, any> = {};
        if (dto.linkedin !== undefined) updateData.linkedin = dto.linkedin;
        if (dto.twitter !== undefined) updateData.twitter = dto.twitter;
        if (dto.facebook !== undefined) updateData.facebook = dto.facebook;
        if (dto.instagram !== undefined) updateData.instagram = dto.instagram;

        const updated = await this.companyRepository.update(employer.id, updateData);

        const completion = await this.completionService.calculateCompletion(employer.id);
        await this.companyRepository.updateCompletion(employer.id, completion.percentage);

        return { ...updated, profileCompletion: completion.percentage };
    }

    async uploadLogo(userId: string, file: Express.Multer.File) {
        const employer = await this.getMyCompany(userId);

        if (employer.companyLogo) {
            const key = this.uploadService.extractKeyFromUrlSafe(employer.companyLogo);
            if (key) {
                const bucketType = this.uploadService.getBucketTypeFromUrl(employer.companyLogo);
                await this.uploadService.deleteFile({ key, bucket: bucketType }).catch(() => null);
            }
        }

        const result = await this.uploadService.uploadFile(file, UPLOAD_CONFIGS.COMPANY_LOGO);

        await this.companyRepository.update(employer.id, { companyLogo: result.fileUrl });

        const completion = await this.completionService.calculateCompletion(employer.id);
        await this.companyRepository.updateCompletion(employer.id, completion.percentage);

        return { companyLogo: result.fileUrl, profileCompletion: completion.percentage };
    }

    async uploadBanner(userId: string, file: Express.Multer.File) {
        const employer = await this.getMyCompany(userId);

        if (employer.companyBanner) {
            const key = this.uploadService.extractKeyFromUrlSafe(employer.companyBanner);
            if (key) {
                const bucketType = this.uploadService.getBucketTypeFromUrl(employer.companyBanner);
                await this.uploadService.deleteFile({ key, bucket: bucketType }).catch(() => null);
            }
        }

        const result = await this.uploadService.uploadFile(file, UPLOAD_CONFIGS.COMPANY_BANNER);

        await this.companyRepository.update(employer.id, { companyBanner: result.fileUrl });

        const completion = await this.completionService.calculateCompletion(employer.id);
        await this.companyRepository.updateCompletion(employer.id, completion.percentage);

        return { companyBanner: result.fileUrl, profileCompletion: completion.percentage };
    }

    async addOfficeLocation(userId: string, dto: AddOfficeLocationDto) {
        const employer = await this.getMyCompany(userId);
        return this.companyRepository.upsertOfficeLocation(employer.id, {
            type: dto.type,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            country: dto.country,
            isHeadquarters: dto.isHeadquarters,
        });
    }

    async removeOfficeLocation(userId: string, locationId: string) {
        const employer = await this.getMyCompany(userId);
        const result = await this.companyRepository.deleteOfficeLocation(locationId, employer.id);
        if (result.count === 0) {
            throw new NotFoundException('Office location not found');
        }
        return { message: 'Office location removed successfully' };
    }

    async addBenefit(userId: string, dto: AddCompanyBenefitDto) {
        const employer = await this.getMyCompany(userId);
        return this.companyRepository.addBenefit(employer.id, {
            title: dto.title,
            description: dto.description,
            ...(dto.icon ? { icon: dto.icon } : {}),
        });
    }

    async removeBenefit(userId: string, benefitId: string) {
        const employer = await this.getMyCompany(userId);
        const result = await this.companyRepository.deleteBenefit(benefitId, employer.id);
        if (result.count === 0) {
            throw new NotFoundException('Company benefit not found');
        }
        return { message: 'Company benefit removed successfully' };
    }

    // ── Private helpers ──────────────────────────────────────────

    private async generateUniqueSlug(companyName: string): Promise<string> {
        const base = companyName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        const existing = await this.companyRepository.findBySlug(base);
        if (!existing) return base;

        let counter = 1;
        while (true) {
            const candidate = `${base}-${counter}`;
            const collision = await this.companyRepository.findBySlug(candidate);
            if (!collision) return candidate;
            counter++;
        }
    }
}
