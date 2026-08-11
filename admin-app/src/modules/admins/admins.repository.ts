// admin-app/src/admin/repositories/admins.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { AdminInviteStatus, Prisma } from '@prisma/client';
import { AdminListQueryDto } from './dto/admins.dto';

const ADMIN_LIST_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    isActive: true,
    lastLogin: true,
    createdAt: true,
    roleAssignments: {
        select: { id: true, role: { select: { id: true, name: true } } },
    },
} satisfies Prisma.AdminSelect;

const INVITE_SELECT = {
    id: true,
    email: true,
    invitedBy: true,
    roleId: true,
    status: true,
    expiresAt: true,
    acceptedAt: true,
    createdAt: true,
} satisfies Prisma.AdminInviteSelect;

@Injectable()
export class AdminsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AdminListQueryDto) {
        const { page = 1, limit = 20, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AdminWhereInput = q
            ? {
                  OR: [
                      { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
                      { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } },
                      { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } },
                  ],
              }
            : {};

        const [items, total] = await this.prisma.$transaction([
            this.prisma.admin.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: ADMIN_LIST_SELECT,
            }),
            this.prisma.admin.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findById(id: string) {
        return this.prisma.admin.findUnique({ where: { id }, select: ADMIN_LIST_SELECT });
    }

    async findByEmail(email: string) {
        return this.prisma.admin.findUnique({ where: { email }, select: { id: true } });
    }

    async createInvite(data: {
        email: string;
        hashedToken: string;
        invitedBy: string;
        roleId?: string;
        expiresAt: Date;
    }) {
        return this.prisma.adminInvite.upsert({
            where: { email: data.email },
            create: {
                email: data.email,
                token: data.hashedToken,
                invitedBy: data.invitedBy,
                roleId: data.roleId,
                expiresAt: data.expiresAt,
                status: AdminInviteStatus.PENDING,
            },
            update: {
                token: data.hashedToken,
                invitedBy: data.invitedBy,
                roleId: data.roleId,
                expiresAt: data.expiresAt,
                status: AdminInviteStatus.PENDING,
                acceptedAt: null,
            },
            select: INVITE_SELECT,
        });
    }

    async findInviteByToken(hashedToken: string) {
        return this.prisma.adminInvite.findUnique({
            where: { token: hashedToken },
            select: INVITE_SELECT,
        });
    }

    async acceptInvite(
        invite: { id: string; email: string; roleId: string | null; invitedBy: string },
        admin: { firstName: string; lastName: string },
    ) {
        return this.prisma.$transaction(async (tx) => {
            const created = await tx.admin.create({
                data: {
                    email: invite.email,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                },
                select: ADMIN_LIST_SELECT,
            });

            if (invite.roleId) {
                await tx.adminRoleAssignment.create({
                    data: { adminId: created.id, roleId: invite.roleId, assignedBy: invite.invitedBy },
                });
            }

            await tx.adminInvite.update({
                where: { id: invite.id },
                data: { status: AdminInviteStatus.ACCEPTED, acceptedAt: new Date() },
            });

            return created;
        });
    }

    async deactivate(id: string) {
        return this.prisma.admin.update({
            where: { id },
            data: { isActive: false },
            select: ADMIN_LIST_SELECT,
        });
    }

    async reactivate(id: string) {
        return this.prisma.admin.update({
            where: { id },
            data: { isActive: true },
            select: ADMIN_LIST_SELECT,
        });
    }
}
