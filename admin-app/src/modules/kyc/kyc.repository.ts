// admin-app/src/admin/repositories/kyc.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { VerificationStatus, Prisma } from '@prisma/client';
import { ACTIONS, Searchable, type ISearchEntity, type SearchResultItem } from '../../common';
import { KycListQueryDto } from './dto/kyc.dto';

@Searchable()
@Injectable()
export class KycRepository implements ISearchEntity {
    readonly key = 'kyc';
    readonly label = 'KYC Verifications';
    readonly action = ACTIONS.KYC.VIEW;

    constructor(private readonly prisma: PrismaService) {}

    async search(q: string, take: number): Promise<SearchResultItem[]> {
        const rows = await this.prisma.employerVerification.findMany({
            where: {
                employer: {
                    OR: [
                        { companyName: { contains: q, mode: Prisma.QueryMode.insensitive } },
                        { contactEmail: { contains: q, mode: Prisma.QueryMode.insensitive } },
                    ],
                },
            },
            select: { id: true, status: true, employer: { select: { companyName: true } } },
            take,
        });
        return rows.map((k) => ({
            id: k.id,
            title: k.employer?.companyName ?? 'Unknown company',
            subtitle: k.status,
            href: `/kyc/${k.id}`,
        }));
    }

    async findAll(query: KycListQueryDto): Promise<{ items: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 20, status, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.EmployerVerificationWhereInput = {
            isLatest: true,
            ...(status ? { status } : {}),
            ...(q
                ? {
                      employer: {
                          OR: [
                              { companyName: { contains: q, mode: Prisma.QueryMode.insensitive } },
                              { contactEmail: { contains: q, mode: Prisma.QueryMode.insensitive } },
                          ],
                      },
                  }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.employerVerification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { submittedAt: 'desc' },
                include: {
                    employer: {
                        select: {
                            id: true,
                            companyName: true,
                            slug: true,
                            companyLogo: true,
                            contactEmail: true,
                        },
                    },
                },
            }),
            this.prisma.employerVerification.count({ where }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findById(id: string) {
        return this.prisma.employerVerification.findUnique({
            where: { id },
            include: {
                employer: {
                    select: {
                        id: true,
                        userId: true,
                        companyName: true,
                        slug: true,
                        companyLogo: true,
                        contactEmail: true,
                        companyWebsite: true,
                    },
                },
            },
        });
    }

    // Atomically approve verification + mark employer verified in one transaction
    async approveWithTransaction(id: string, employerId: string, adminId: string, adminNotes?: string) {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.employerVerification.update({
                where: { id },
                data: {
                    status: VerificationStatus.APPROVED,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                    adminNotes,
                    statusHistory: {
                        push: {
                            status: VerificationStatus.APPROVED,
                            timestamp: new Date().toISOString(),
                            by: adminId,
                            ...(adminNotes ? { notes: adminNotes } : {}),
                        },
                    },
                },
            });
            await tx.employer.update({
                where: { id: employerId },
                data: { isVerified: true },
            });
            return updated;
        });
    }

    // Atomically reject verification + optionally revoke employer verification
    async rejectWithTransaction(
        id: string,
        employerId: string,
        adminId: string,
        rejectionReason: string,
        adminNotes?: string,
        revokeVerification = false,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.employerVerification.update({
                where: { id },
                data: {
                    status: VerificationStatus.REJECTED,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                    rejectionReason,
                    adminNotes,
                    statusHistory: {
                        push: {
                            status: VerificationStatus.REJECTED,
                            timestamp: new Date().toISOString(),
                            by: adminId,
                            reason: rejectionReason,
                            ...(adminNotes ? { notes: adminNotes } : {}),
                        },
                    },
                },
            });
            if (revokeVerification) {
                await tx.employer.update({
                    where: { id: employerId },
                    data: { isVerified: false },
                });
            }
            return updated;
        });
    }
}
