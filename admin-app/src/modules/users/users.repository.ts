// admin-app/src/admin/repositories/users.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { AccountStatus, Prisma } from '@prisma/client';
import { AdminUserListQueryDto } from './dto/users.dto';

const USER_LIST_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    status: true,
    isEmailVerified: true,
    lastLogin: true,
    createdAt: true,
    profileImage: true,
    isFlagged: true,
} satisfies Prisma.UserSelect;

type UserListItem = Prisma.UserGetPayload<{ select: typeof USER_LIST_SELECT }>;

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AdminUserListQueryDto): Promise<{ items: UserListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 20, role, status, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            ...(role ? { role } : {}),
            ...(status ? { status } : {}),
            ...(q
                ? {
                      OR: [
                          { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
                          { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } },
                          { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } },
                      ],
                  }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: USER_LIST_SELECT,
            }),
            this.prisma.user.count({ where }),
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
        return this.prisma.user.findUnique({
            where: { id },
            select: this.detailSelect,
        });
    }

    private readonly detailSelect = {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        isEmailVerified: true,
        lastLogin: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        profileImage: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        isFlagged: true,
        flaggedReason: true,
        flaggedAt: true,
        flaggedBy: true,
        employer: {
            select: {
                id: true,
                companyName: true,
                companyType: true,
                industry: true,
                companySize: true,
                location: true,
                slug: true,
                companyWebsite: true,
                contactEmail: true,
                foundedYear: true,
                tagline: true,
                cultureDescription: true,
                companyLogo: true,
                companyBanner: true,
                about: true,
                mission: true,
                vision: true,
                linkedin: true,
                twitter: true,
                facebook: true,
                instagram: true,
                profileCompletion: true,
                isVerified: true,
                verifiedAt: true,
                isActive: true,
                isFlagged: true,
                createdAt: true,
            },
        },
        jobSeekerProfile: {
            select: {
                id: true,
                title: true,
                professionalSummary: true,
                location: { select: { displayName: true } },
                linkedin: true,
                github: true,
                portfolio: true,
                twitter: true,
                professionalEmail: true,
                availability: true,
                profileCompletion: true,
                experiences: { orderBy: { startDate: 'desc' } },
                education: { include: { institute: { select: { name: true } } } },
                skills: { include: { skill: { select: { name: true, category: { select: { name: true } } } } } },
                certifications: { include: { certification: { select: { name: true } } } },
                projects: true,
                ctfProfiles: true,
                resumes: {
                    select: { id: true, fileName: true, fileSize: true, fileType: true, uploadedAt: true },
                    orderBy: { uploadedAt: 'desc' },
                },
            },
        },
        applications: {
            select: {
                id: true,
                status: true,
                aiScore: true,
                appliedAt: true,
                job: { select: { id: true, jobTitle: true, employer: { select: { companyName: true } } } },
            },
            orderBy: { appliedAt: 'desc' },
        },
    } satisfies Prisma.UserSelect;

    async suspend(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { status: AccountStatus.SUSPENDED },
            select: this.detailSelect,
        });
    }

    async unsuspend(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { status: AccountStatus.ACTIVE },
            select: this.detailSelect,
        });
    }

    async softDelete(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { status: AccountStatus.DELETED },
            select: this.detailSelect,
        });
    }

    async verifyEmail(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { isEmailVerified: true, emailVerifiedAt: new Date() },
            select: this.detailSelect,
        });
    }

    async unlock(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { failedLoginAttempts: 0, lockedUntil: null, lastFailedLoginAt: null },
            select: this.detailSelect,
        });
    }

    async flag(id: string, adminId: string, reason: string) {
        return this.prisma.user.update({
            where: { id },
            data: { isFlagged: true, flaggedReason: reason, flaggedAt: new Date(), flaggedBy: adminId },
            select: this.detailSelect,
        });
    }

    async unflag(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { isFlagged: false, flaggedReason: null, flaggedAt: null, flaggedBy: null },
            select: this.detailSelect,
        });
    }
}
