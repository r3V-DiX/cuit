// apps/employer-service/src/employer/services/kyc.service.ts

import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { EmployerMemberRole, VerificationStatus } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';
import { UploadService, UPLOAD_CONFIGS } from '@cykruit/upload';
import { KycRepository } from '../repositories/kyc.repository';
import { CompanyRepository } from '../repositories/company.repository';

/** Statuses that block a new submission */
const BLOCKING_STATUSES: VerificationStatus[] = [
    VerificationStatus.PENDING,
    VerificationStatus.UNDER_REVIEW,
];

@Injectable()
export class KycService {
    constructor(
        private readonly kycRepository: KycRepository,
        private readonly companyRepository: CompanyRepository,
        private readonly uploadService: UploadService,
        private readonly prisma: PrismaService,
    ) {}

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Returns the current (isLatest) verification record for the user's company.
     * Throws NotFoundException if the user is not a company member.
     */
    async getStatus(userId: string) {
        const company = await this.resolveCompanyOrThrow(userId);
        const verification = await this.kycRepository.findLatest(company.id);

        return {
            companyId: company.id,
            isVerified: company.isVerified,
            verifiedAt: company.verifiedAt ?? null,
            verification: verification ?? null,
        };
    }

    /**
     * Returns all past verification submissions for the user's company.
     */
    async getHistory(userId: string) {
        const company = await this.resolveCompanyOrThrow(userId);
        const verifications = await this.kycRepository.findAll(company.id);
        return { verifications, total: verifications.length };
    }

    /**
     * Submits a new KYC verification.
     *  - Caller must be OWNER or HIRING_MANAGER.
     *  - Company must have all required snapshot fields populated.
     *  - A new submission is blocked when latest is PENDING or UNDER_REVIEW.
     */
    async submit(userId: string, file: Express.Multer.File) {
        const { company, member } = await this.resolveCompanyAndMemberOrThrow(userId);

        this.assertCanSubmitKyc(member.role);
        this.assertCompanyProfileComplete(company);

        const latest = await this.kycRepository.findLatest(company.id);
        if (latest && BLOCKING_STATUSES.includes(latest.status)) {
            throw new ConflictException(
                `A verification is already ${latest.status.toLowerCase().replace('_', ' ')}. ` +
                    'You cannot submit a new one until the current review is complete.',
            );
        }

        const uploadResult = await this.uploadService.uploadFile(
            file,
            UPLOAD_CONFIGS.KYC_DOCUMENT,
        );

        return this.kycRepository.create(company.id, {
            documentUrl: uploadResult.fileUrl,
            documentKey: uploadResult.key,
            documentFileName: uploadResult.fileName,
            companyName: company.companyName,
            companyWebsite: company.companyWebsite ?? '',
            companyType: company.companyType,
            industry: company.industry,
            companySize: company.companySize,
            location: company.location,
        });
    }

    /**
     * Resubmits a KYC document after a REJECTED decision.
     * All the same checks as submit() apply, plus the latest must be REJECTED.
     */
    async resubmit(userId: string, file: Express.Multer.File) {
        const { company, member } = await this.resolveCompanyAndMemberOrThrow(userId);

        this.assertCanSubmitKyc(member.role);
        this.assertCompanyProfileComplete(company);

        const latest = await this.kycRepository.findLatest(company.id);
        if (!latest) {
            throw new BadRequestException(
                'No previous verification found. Please use the submit endpoint for your first submission.',
            );
        }
        if (latest.status !== VerificationStatus.REJECTED) {
            throw new ConflictException(
                `Resubmission is only allowed after a rejection. Current status: ${latest.status}.`,
            );
        }

        const uploadResult = await this.uploadService.uploadFile(
            file,
            UPLOAD_CONFIGS.KYC_DOCUMENT,
        );

        return this.kycRepository.create(company.id, {
            documentUrl: uploadResult.fileUrl,
            documentKey: uploadResult.key,
            documentFileName: uploadResult.fileName,
            companyName: company.companyName,
            companyWebsite: company.companyWebsite ?? '',
            companyType: company.companyType,
            industry: company.industry,
            companySize: company.companySize,
            location: company.location,
        });
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    /** Resolves the Employer record for the given userId or throws 404. */
    private async resolveCompanyOrThrow(userId: string) {
        const company = await this.companyRepository.findByMemberId(userId);
        if (!company) {
            throw new NotFoundException(
                'No company found for this user. Please create or join a company first.',
            );
        }
        return company;
    }

    /**
     * Resolves both the Employer record and the EmployerMember row for the
     * given userId. Throws if either is missing.
     */
    private async resolveCompanyAndMemberOrThrow(userId: string) {
        const company = await this.resolveCompanyOrThrow(userId);

        const member = await this.prisma.employerMember.findUnique({
            where: {
                employerId_userId: {
                    employerId: company.id,
                    userId,
                },
            },
            select: { role: true },
        });

        if (!member) {
            throw new ForbiddenException('You are not a member of this company.');
        }

        return { company, member };
    }

    /**
     * Only OWNER and HIRING_MANAGER may submit KYC documents.
     */
    private assertCanSubmitKyc(role: EmployerMemberRole): void {
        const allowed: EmployerMemberRole[] = [
            EmployerMemberRole.OWNER,
            EmployerMemberRole.HIRING_MANAGER,
        ];
        if (!allowed.includes(role)) {
            throw new ForbiddenException(
                'Only an Owner or Hiring Manager can submit KYC documents.',
            );
        }
    }

    /**
     * Validates that the company has the minimum required fields to snapshot.
     * The schema marks companyName, companyType, industry, companySize and
     * location as non-nullable, but companyWebsite is optional — we allow an
     * empty string as the snapshot value when it is absent.
     */
    private assertCompanyProfileComplete(
        company: Awaited<ReturnType<CompanyRepository['findByMemberId']>>,
    ): void {
        const missing: string[] = [];
        if (!company.companyName?.trim()) missing.push('companyName');
        if (!company.companyType) missing.push('companyType');
        if (!company.industry) missing.push('industry');
        if (!company.companySize) missing.push('companySize');
        if (!company.location?.trim()) missing.push('location');

        if (missing.length > 0) {
            throw new BadRequestException(
                `Company profile is incomplete. Missing required fields: ${missing.join(', ')}.`,
            );
        }
    }
}
