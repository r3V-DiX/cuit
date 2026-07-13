// admin-app/src/admin/repositories/users.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { AccountStatus, Prisma } from '@prisma/client';
import { AdminUserListQueryDto } from '../dto/users.dto';

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AdminUserListQueryDto): Promise<{ items: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
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
                select: {
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
                },
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
        employer: {
            select: {
                id: true,
                companyName: true,
                industry: true,
                location: true,
                companyWebsite: true,
            },
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
}
