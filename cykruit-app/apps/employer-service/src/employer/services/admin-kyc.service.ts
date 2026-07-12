// apps/employer-service/src/employer/services/admin-kyc.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { VerificationStatus, EmployerVerification, Prisma } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';
import { AuditService } from '@cykruit/audit';
import { KycRepository } from '../repositories/kyc.repository';

const REVIEWABLE_STATUSES: VerificationStatus[] = [
    VerificationStatus.PENDING,
    VerificationStatus.UNDER_REVIEW,
];

export interface KycPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedKycResult {
    items: EmployerVerification[];
    pagination: KycPagination;
}

const EMPLOYER_KYC_SELECT = {
    id: true,
    companyName: true,
    slug: true,
    contactEmail: true,
    companyWebsite: true,
    companyLogo: true,
} satisfies Prisma.EmployerSelect;

type EmployerKycSummary = {
    id: string;
    companyName: string;
    slug: string;
    contactEmail: string;
    companyWebsite: string | null;
    companyLogo: string | null;
};

export interface KycWithEmployer extends EmployerVerification {
    employer: EmployerKycSummary;
}

@Injectable()
export class AdminKycService {
    constructor(
        private readonly kycRepository: KycRepository,
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {}

    async listKyc(query: {
        page?: number;
        limit?: number;
        q?: string;
        status?: VerificationStatus;
    }): Promise<PaginatedKycResult> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.EmployerVerificationWhereInput = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.q) {
            where.companyName = { contains: query.q, mode: 'insensitive' };
        }

        const [total, items] = await this.prisma.$transaction([
            this.prisma.employerVerification.count({ where }),
            this.prisma.employerVerification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { submittedAt: 'desc' },
            }),
        ]);

        return {
            items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getKyc(id: string): Promise<KycWithEmployer> {
        const verification = await this.prisma.employerVerification.findUnique({
            where: { id },
            include: {
                employer: {
                    select: EMPLOYER_KYC_SELECT,
                },
            },
        });

        if (!verification) {
            throw new NotFoundException(`KYC verification with id "${id}" not found.`);
        }

        return verification as KycWithEmployer;
    }

    async approveKyc(
        id: string,
        adminNotes: string | undefined,
        actorId: string,
    ): Promise<EmployerVerification> {
        const verification = await this.kycRepository.findById(id);

        if (!verification) {
            throw new NotFoundException(`KYC verification with id "${id}" not found.`);
        }

        if (!REVIEWABLE_STATUSES.includes(verification.status)) {
            throw new BadRequestException(
                `Cannot approve a verification with status "${verification.status}". Only PENDING or UNDER_REVIEW records may be approved.`,
            );
        }

        const updated = await this.prisma.$transaction(async () => {
            const result = await this.kycRepository.updateStatus(
                id,
                VerificationStatus.APPROVED,
                actorId,
                undefined,
                adminNotes,
            );

            await this.prisma.employer.update({
                where: { id: verification.employerId },
                data: {
                    isVerified: true,
                    verifiedAt: new Date(),
                    verifiedBy: actorId,
                },
            });

            return result;
        });

        this.auditService.logAction({
            actorId,
            actorRole: 'ADMIN',
            action: 'kyc:approve',
            module: 'KYC',
            targetType: 'EmployerVerification',
            targetId: id,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
            newData: { adminNotes },
        });

        return updated;
    }

    async rejectKyc(
        id: string,
        rejectionReason: string,
        adminNotes: string | undefined,
        actorId: string,
    ): Promise<EmployerVerification> {
        const verification = await this.kycRepository.findById(id);

        if (!verification) {
            throw new NotFoundException(`KYC verification with id "${id}" not found.`);
        }

        if (!REVIEWABLE_STATUSES.includes(verification.status)) {
            throw new BadRequestException(
                `Cannot reject a verification with status "${verification.status}". Only PENDING or UNDER_REVIEW records may be rejected.`,
            );
        }

        const updated = await this.kycRepository.updateStatus(
            id,
            VerificationStatus.REJECTED,
            actorId,
            rejectionReason,
            adminNotes,
        );

        this.auditService.logAction({
            actorId,
            actorRole: 'ADMIN',
            action: 'kyc:reject',
            module: 'KYC',
            targetType: 'EmployerVerification',
            targetId: id,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
            newData: { rejectionReason, adminNotes },
        });

        return updated;
    }
}
