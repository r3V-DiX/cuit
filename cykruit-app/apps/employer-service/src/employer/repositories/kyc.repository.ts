// apps/employer-service/src/employer/repositories/kyc.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import {
    EmployerVerification,
    VerificationStatus,
    CompanyType,
    Industry,
    CompanySize,
    Prisma,
} from '@prisma/client';

export interface CreateVerificationData {
    documentUrl: string;
    documentKey: string;
    documentFileName: string;
    companyName: string;
    companyWebsite: string;
    companyType: CompanyType;
    industry: Industry;
    companySize: CompanySize;
    location: string;
}

export interface StatusHistoryEntry {
    status: VerificationStatus;
    timestamp: string;
    by: string;
    reason?: string;
}

@Injectable()
export class KycRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Returns the current active (isLatest = true) verification for an employer.
     */
    async findLatest(employerId: string): Promise<EmployerVerification | null> {
        return this.prisma.employerVerification.findFirst({
            where: { employerId, isLatest: true },
        });
    }

    /**
     * Returns all verifications for an employer ordered newest-first.
     */
    async findAll(employerId: string): Promise<EmployerVerification[]> {
        return this.prisma.employerVerification.findMany({
            where: { employerId },
            orderBy: { submittedAt: 'desc' },
        });
    }

    /**
     * Returns a single verification record by its primary key.
     */
    async findById(id: string): Promise<EmployerVerification | null> {
        return this.prisma.employerVerification.findUnique({
            where: { id },
        });
    }

    /**
     * Creates a new verification record inside a transaction.
     * Any previous isLatest record for the same employer is set to false first.
     */
    async create(
        employerId: string,
        data: CreateVerificationData,
    ): Promise<EmployerVerification> {
        return this.prisma.$transaction(async (tx) => {
            // Demote previous latest record if it exists
            await tx.employerVerification.updateMany({
                where: { employerId, isLatest: true },
                data: { isLatest: false },
            });

            const initialHistoryEntry: StatusHistoryEntry = {
                status: VerificationStatus.PENDING,
                timestamp: new Date().toISOString(),
                by: 'system',
            };

            return tx.employerVerification.create({
                data: {
                    employerId,
                    documentUrl: data.documentUrl,
                    documentKey: data.documentKey,
                    documentFileName: data.documentFileName,
                    companyName: data.companyName,
                    companyWebsite: data.companyWebsite,
                    companyType: data.companyType,
                    industry: data.industry,
                    companySize: data.companySize,
                    location: data.location,
                    status: VerificationStatus.PENDING,
                    isLatest: true,
                    statusHistory: [initialHistoryEntry as unknown as Prisma.InputJsonValue],
                },
            });
        });
    }

    /**
     * Updates the status of a verification and appends a new entry to statusHistory.
     * Used by admin-service when approving or rejecting.
     */
    async updateStatus(
        id: string,
        status: VerificationStatus,
        reviewedBy?: string,
        rejectionReason?: string,
        adminNotes?: string,
    ): Promise<EmployerVerification> {
        const existing = await this.prisma.employerVerification.findUniqueOrThrow({
            where: { id },
            select: { statusHistory: true },
        });

        const newEntry: StatusHistoryEntry = {
            status,
            timestamp: new Date().toISOString(),
            by: reviewedBy ?? 'admin',
            ...(rejectionReason ? { reason: rejectionReason } : {}),
        };

        const updatedHistory = [
            ...(existing.statusHistory as unknown as StatusHistoryEntry[]),
            newEntry,
        ] as unknown as Prisma.InputJsonValue[];

        return this.prisma.employerVerification.update({
            where: { id },
            data: {
                status,
                reviewedBy: reviewedBy ?? null,
                reviewedAt: new Date(),
                rejectionReason: rejectionReason ?? null,
                adminNotes: adminNotes ?? null,
                statusHistory: updatedHistory,
            },
        });
    }
}
