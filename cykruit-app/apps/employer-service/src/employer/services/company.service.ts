// apps/employer-service/src/employer/services/company.service.ts

import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { EmployerMemberRole, JoinRequestStatus } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';
import { UploadService, UPLOAD_CONFIGS } from '@cykruit/upload';
import { EmployerCompletionService, CompanyErrorCodes } from '@cykruit/common';
import { EventPublisher, DomainEventType, type JoinRequestReceivedPayload, type JoinRequestResolvedPayload } from '@cykruit/events';
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

    // ── Join Request ─────────────────────────────────────────────

    /**
     * Returns the verified company (if any) that shares the same email domain
     * as the requesting user. Used on the post-register screen to decide
     * whether to show "request to join" or "set up your own company".
     */
    async checkDomain(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (!user) throw new NotFoundException('User not found.');

        const domain = user.email.split('@')[1]?.toLowerCase();
        if (!domain) return { found: false, company: null };

        // Find any verified employer where at least one member's email matches domain
        const match = await this.prisma.employer.findFirst({
            where: {
                isVerified: true,
                members: {
                    some: {
                        user: { email: { endsWith: `@${domain}` } },
                    },
                },
            },
            select: { id: true, companyName: true, companyLogo: true, location: true },
        });

        if (!match) return { found: false, company: null };
        return { found: true, company: match };
    }

    /**
     * Creates a join request for the requesting user to join the company
     * that owns their email domain. Sends WS event to notify the OWNER.
     */
    async requestToJoin(userId: string, message?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, firstName: true, lastName: true },
        });
        if (!user) throw new NotFoundException('User not found.');

        const domain = user.email.split('@')[1]?.toLowerCase();
        if (!domain) throw new BadRequestException('Could not determine email domain.');

        const employer = await this.prisma.employer.findFirst({
            where: {
                isVerified: true,
                members: {
                    some: { user: { email: { endsWith: `@${domain}` } } },
                },
            },
            include: {
                members: {
                    where: { role: EmployerMemberRole.OWNER },
                    include: { user: { select: { id: true } } },
                    take: 1,
                },
            },
        });
        if (!employer) throw new NotFoundException('No verified company found for your email domain.');

        // Already a member
        const alreadyMember = await this.prisma.employerMember.findUnique({
            where: { employerId_userId: { employerId: employer.id, userId } },
        });
        if (alreadyMember) throw new ConflictException('You are already a member of this company.');

        // Existing pending request
        const existing = await this.prisma.employerJoinRequest.findUnique({
            where: { employerId_requesterId: { employerId: employer.id, requesterId: userId } },
        });
        if (existing && existing.status === JoinRequestStatus.PENDING) {
            throw new ConflictException('You already have a pending join request for this company.');
        }

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const joinRequest = await this.prisma.employerJoinRequest.upsert({
            where: { employerId_requesterId: { employerId: employer.id, requesterId: userId } },
            create: { employerId: employer.id, requesterId: userId, message, expiresAt, status: JoinRequestStatus.PENDING },
            update: { status: JoinRequestStatus.PENDING, message, expiresAt, resolvedAt: null, resolvedBy: null },
        });

        const ownerUserId = employer.members[0]?.user?.id;
        if (ownerUserId) {
            this.eventPublisher.publish(
                DomainEventType.JOIN_REQUEST_RECEIVED,
                {
                    joinRequestId: joinRequest.id,
                    employerId: employer.id,
                    ownerUserId,
                    companyName: employer.companyName,
                    requesterUserId: userId,
                    requesterEmail: user.email,
                    requesterName: `${user.firstName} ${user.lastName}`.trim() || user.email,
                } satisfies JoinRequestReceivedPayload,
                'employer-service',
            );
        }

        return joinRequest;
    }

    /** Returns pending join requests for the authenticated user's company. OWNER/HIRING_MANAGER only. */
    async getJoinRequests(userId: string) {
        const employer = await this.companyRepository.findByMemberId(userId);
        if (!employer) throw new NotFoundException('No company found for your account.');

        const member = await this.prisma.employerMember.findUnique({
            where: { employerId_userId: { employerId: employer.id, userId } },
            select: { role: true },
        });
        if (!member || (member.role !== EmployerMemberRole.OWNER && member.role !== EmployerMemberRole.HIRING_MANAGER)) {
            throw new ForbiddenException('Only OWNER or HIRING_MANAGER can view join requests.');
        }

        // Auto-expire stale requests
        await this.prisma.employerJoinRequest.updateMany({
            where: { employerId: employer.id, status: JoinRequestStatus.PENDING, expiresAt: { lt: new Date() } },
            data: { status: JoinRequestStatus.EXPIRED },
        });

        return this.prisma.employerJoinRequest.findMany({
            where: { employerId: employer.id, status: JoinRequestStatus.PENDING },
            include: {
                requester: { select: { id: true, email: true, firstName: true, lastName: true, profileImage: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    /** Owner/HM accepts or rejects a join request. Accept atomically adds the user as RECRUITER. */
    async resolveJoinRequest(
        userId: string,
        joinRequestId: string,
        status: 'ACCEPTED' | 'REJECTED',
    ) {
        const employer = await this.companyRepository.findByMemberId(userId);
        if (!employer) throw new NotFoundException('No company found for your account.');

        const member = await this.prisma.employerMember.findUnique({
            where: { employerId_userId: { employerId: employer.id, userId } },
            select: { role: true },
        });
        if (!member || (member.role !== EmployerMemberRole.OWNER && member.role !== EmployerMemberRole.HIRING_MANAGER)) {
            throw new ForbiddenException('Only OWNER or HIRING_MANAGER can resolve join requests.');
        }

        const joinRequest = await this.prisma.employerJoinRequest.findUnique({
            where: { id: joinRequestId },
            include: { requester: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
        });
        if (!joinRequest || joinRequest.employerId !== employer.id) {
            throw new NotFoundException('Join request not found.');
        }
        if (joinRequest.status !== 'PENDING') {
            throw new ConflictException(`Join request is already ${joinRequest.status.toLowerCase()}.`);
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.employerJoinRequest.update({
                where: { id: joinRequestId },
                data: { status, resolvedBy: userId, resolvedAt: new Date() },
            });

            if (status === 'ACCEPTED') {
                // Upgrade role from SEEKER to EMPLOYER if needed
                if (joinRequest.requester.role === 'SEEKER') {
                    await tx.user.update({
                        where: { id: joinRequest.requesterId },
                        data: { role: 'EMPLOYER' },
                    });
                }
                await tx.employerMember.create({
                    data: {
                        employerId: employer.id,
                        userId: joinRequest.requesterId,
                        role: EmployerMemberRole.RECRUITER,
                        invitedBy: userId,
                    },
                });
                await tx.employerSubscription.updateMany({
                    where: { employerId: employer.id },
                    data: { currentTeamMembers: { increment: 1 } },
                });
            }
        });

        this.eventPublisher.publish(
            DomainEventType.JOIN_REQUEST_RESOLVED,
            {
                joinRequestId,
                employerId: employer.id,
                companyName: employer.companyName,
                requesterUserId: joinRequest.requesterId,
                status,
                resolvedByUserId: userId,
            } satisfies JoinRequestResolvedPayload,
            'employer-service',
        );

        return { message: status === 'ACCEPTED' ? 'User added to your team.' : 'Join request rejected.' };
    }

    /** Returns the current join request status for the authenticated user (used by post-register screen). */
    async getMyJoinRequest(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (!user) throw new NotFoundException('User not found.');

        const domain = user.email.split('@')[1]?.toLowerCase();
        if (!domain) return null;

        const employer = await this.prisma.employer.findFirst({
            where: { isVerified: true, members: { some: { user: { email: { endsWith: `@${domain}` } } } } },
            select: { id: true },
        });
        if (!employer) return null;

        return this.prisma.employerJoinRequest.findUnique({
            where: { employerId_requesterId: { employerId: employer.id, requesterId: userId } },
            select: { id: true, status: true, createdAt: true, expiresAt: true },
        });
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
