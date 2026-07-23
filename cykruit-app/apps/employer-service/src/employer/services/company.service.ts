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
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { AuditService } from '@cykruit/audit';
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
        private readonly eventPublisher: EventPublisher,
        private readonly auditService: AuditService,
    ) { }

    async getMyCompany(userId: string) {
        const employer = await this.companyRepository.findByMemberId(userId);
        if (!employer) {
            throw new NotFoundException(CompanyErrorCodes.COMPANY_NOT_FOUND);
        }
        return employer;
    }

    async setupCompany(userId: string, dto: CreateCompanyDto, ipAddress?: string, userAgent?: string) {
        let existingCompany = await this.companyRepository.findByMemberId(userId);
        if (!existingCompany) {
            const stub = await this.prisma.employer.findFirst({ where: { userId } });
            if (stub) existingCompany = await this.companyRepository.findById(stub.id);
        }

        const slug = await this.generateUniqueSlug(dto.companyName);

        const companyData = {
            companyName: dto.companyName,
            companyType: dto.companyType,
            industry: dto.industry,
            companySize: dto.companySize,
            location: dto.location,
            slug,
            ...(dto.companyWebsite ? { companyWebsite: dto.companyWebsite } : {}),
            ...(dto.contactEmail ? { contactEmail: dto.contactEmail } : {}),
        };

        const companyId = existingCompany
            ? (await this.companyRepository.update(existingCompany.id, companyData)).id
            : (await this.companyRepository.create(userId, companyData)).id;

        const member = await this.prisma.employerMember.findUnique({
            where: {
                employerId_userId: {
                    employerId: companyId,
                    userId,
                },
            },
        });
        if (!member) {
            await this.companyRepository.addMember(companyId, userId, EmployerMemberRole.OWNER);
        }

        const employer = await this.companyRepository.findById(companyId);
        if (!employer) {
            throw new NotFoundException('Company not found after setup');
        }

        const completion = await this.completionService.calculateCompletion(employer.id);
        await this.companyRepository.updateCompletion(employer.id, completion.percentage);

        this.eventPublisher.publish(
            DomainEventType.EMPLOYER_SETUP_COMPLETE,
            { employerId: employer.id, userId },
            'employer-service',
        );

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:setup',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            newData: { companyName: employer.companyName },
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return { ...employer, profileCompletion: completion.percentage };
    }

    async updateBasic(userId: string, dto: UpdateCompanyBasicDto, ipAddress?: string, userAgent?: string) {
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

        if (dto.companyName && dto.companyName !== employer.companyName) {
            updateData.slug = await this.generateUniqueSlug(dto.companyName);
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.employer.update({ where: { id: employer.id }, data: updateData });
            const completion = await this.completionService.calculateCompletion(employer.id);
            await tx.employer.update({ where: { id: employer.id }, data: { profileCompletion: completion.percentage } });
            return { ...result, profileCompletion: completion.percentage };
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:update_basic',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            newData: updateData,
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return updated;
    }

    async updateAbout(userId: string, dto: UpdateCompanyAboutDto, ipAddress?: string, userAgent?: string) {
        const employer = await this.getMyCompany(userId);

        const updateData: Record<string, any> = {};
        if (dto.about !== undefined) updateData.about = dto.about;
        if (dto.mission !== undefined) updateData.mission = dto.mission;
        if (dto.vision !== undefined) updateData.vision = dto.vision;
        if (dto.cultureDescription !== undefined) updateData.cultureDescription = dto.cultureDescription;

        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.employer.update({ where: { id: employer.id }, data: updateData });
            const completion = await this.completionService.calculateCompletion(employer.id);
            await tx.employer.update({ where: { id: employer.id }, data: { profileCompletion: completion.percentage } });
            return { ...result, profileCompletion: completion.percentage };
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:update_about',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return updated;
    }

    async updateSocial(userId: string, dto: UpdateCompanySocialDto, ipAddress?: string, userAgent?: string) {
        const employer = await this.getMyCompany(userId);

        const updateData: Record<string, any> = {};
        if (dto.linkedin !== undefined) updateData.linkedin = dto.linkedin;
        if (dto.twitter !== undefined) updateData.twitter = dto.twitter;
        if (dto.facebook !== undefined) updateData.facebook = dto.facebook;
        if (dto.instagram !== undefined) updateData.instagram = dto.instagram;

        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.employer.update({ where: { id: employer.id }, data: updateData });
            const completion = await this.completionService.calculateCompletion(employer.id);
            await tx.employer.update({ where: { id: employer.id }, data: { profileCompletion: completion.percentage } });
            return { ...result, profileCompletion: completion.percentage };
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:update_social',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return updated;
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

        const completion = await this.completionService.calculateCompletion(employer.id);
        await this.prisma.$transaction(async (tx) => {
            await tx.employer.update({ where: { id: employer.id }, data: { companyLogo: result.fileUrl } });
            await tx.employer.update({ where: { id: employer.id }, data: { profileCompletion: completion.percentage } });
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:upload_logo',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            result: 'SUCCESS',
        });

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

        const completion = await this.completionService.calculateCompletion(employer.id);
        await this.prisma.$transaction(async (tx) => {
            await tx.employer.update({ where: { id: employer.id }, data: { companyBanner: result.fileUrl } });
            await tx.employer.update({ where: { id: employer.id }, data: { profileCompletion: completion.percentage } });
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:upload_banner',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            result: 'SUCCESS',
        });

        return { companyBanner: result.fileUrl, profileCompletion: completion.percentage };
    }

    async addOfficeLocation(userId: string, dto: AddOfficeLocationDto) {
        const employer = await this.getMyCompany(userId);
        const location = await this.companyRepository.upsertOfficeLocation(employer.id, {
            type: dto.type,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            country: dto.country,
            isHeadquarters: dto.isHeadquarters,
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:add_location',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            newData: { city: dto.city, country: dto.country },
            result: 'SUCCESS',
        });

        return location;
    }

    async removeOfficeLocation(userId: string, locationId: string) {
        const employer = await this.getMyCompany(userId);
        const result = await this.companyRepository.deleteOfficeLocation(locationId, employer.id);
        if (result.count === 0) {
            throw new NotFoundException('Office location not found');
        }

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:remove_location',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            reason: `locationId: ${locationId}`,
            result: 'SUCCESS',
        });

        return { message: 'Office location removed successfully' };
    }

    async addBenefit(userId: string, dto: AddCompanyBenefitDto) {
        const employer = await this.getMyCompany(userId);
        const benefit = await this.companyRepository.addBenefit(employer.id, {
            title: dto.title,
            description: dto.description,
            ...(dto.icon ? { icon: dto.icon } : {}),
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:add_benefit',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            newData: { title: dto.title },
            result: 'SUCCESS',
        });

        return benefit;
    }

    async removeBenefit(userId: string, benefitId: string) {
        const employer = await this.getMyCompany(userId);
        const result = await this.companyRepository.deleteBenefit(benefitId, employer.id);
        if (result.count === 0) {
            throw new NotFoundException('Company benefit not found');
        }

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'company:remove_benefit',
            module: 'COMPANY',
            targetType: 'Employer',
            targetId: employer.id,
            reason: `benefitId: ${benefitId}`,
            result: 'SUCCESS',
        });

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
