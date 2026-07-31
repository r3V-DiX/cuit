// apps/employer-service/src/employer/repositories/team.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { EmployerMemberRole, TokenType } from '@prisma/client';

@Injectable()
export class TeamRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ── Member Queries ────────────────────────────────────────────

    async findMembers(employerId: string) {
        return this.prisma.employerMember.findMany({
            where: { employerId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findMember(employerId: string, userId: string) {
        return this.prisma.employerMember.findUnique({
            where: { employerId_userId: { employerId, userId } },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
    }

    async findMemberById(memberId: string) {
        return this.prisma.employerMember.findUnique({
            where: { id: memberId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
    }

    async findOwner(employerId: string) {
        return this.prisma.employerMember.findFirst({
            where: { employerId, role: EmployerMemberRole.OWNER },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
    }

    // ── Member Mutations ──────────────────────────────────────────

    private static readonly MEMBER_SELECT = {
        id: true,
        employerId: true,
        userId: true,
        role: true,
        joinedAt: true,
    } as const;

    async addMember(
        employerId: string,
        userId: string,
        role: EmployerMemberRole,
        invitedBy?: string,
    ) {
        return this.prisma.employerMember.create({
            data: {
                employerId,
                userId,
                role,
                ...(invitedBy ? { invitedBy } : {}),
            },
            select: TeamRepository.MEMBER_SELECT,
        });
    }

    async updateMemberRole(memberId: string, newRole: EmployerMemberRole) {
        return this.prisma.employerMember.update({
            where: { id: memberId },
            data: { role: newRole },
            select: TeamRepository.MEMBER_SELECT,
        });
    }

    async removeMember(memberId: string) {
        return this.prisma.employerMember.delete({
            where: { id: memberId },
        });
    }

    async transferOwnership(
        employerId: string,
        newOwnerMemberId: string,
        currentOwnerMemberId: string,
        currentOwnerNewRole: EmployerMemberRole,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const newOwner = await tx.employerMember.update({
                where: { id: newOwnerMemberId },
                data: { role: EmployerMemberRole.OWNER },
            });

            const previousOwner = await tx.employerMember.update({
                where: { id: currentOwnerMemberId },
                data: { role: currentOwnerNewRole },
            });

            return { newOwner, previousOwner };
        });
    }

    // ── Invite Token Methods ──────────────────────────────────────

    async createInviteToken(
        inviterUserId: string,
        rawTokenHash: string,
        expiresAt: Date,
        employerId: string,
        invitedEmail: string,
        role: string,
    ) {
        return this.prisma.token.create({
            data: {
                userId: inviterUserId,
                token: rawTokenHash,
                type: TokenType.EMPLOYER_INVITE,
                expiresAt,
                employerId,
                metadata: { invitedEmail, role },
            },
        });
    }

    async getInvites(employerId: string) {
        return this.prisma.token.findMany({
            where: { employerId, type: TokenType.EMPLOYER_INVITE },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                metadata: true,
                createdAt: true,
                expiresAt: true,
                usedAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    async findInviteById(tokenId: string, employerId: string) {
        return this.prisma.token.findFirst({
            where: { id: tokenId, employerId, type: TokenType.EMPLOYER_INVITE },
        });
    }

    async expireInvite(tokenId: string) {
        return this.prisma.token.update({
            where: { id: tokenId },
            data: { expiresAt: new Date() },
        });
    }

    async findInviteToken(rawTokenHash: string) {
        return this.prisma.token.findFirst({
            where: {
                token: rawTokenHash,
                type: TokenType.EMPLOYER_INVITE,
                usedAt: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });
    }

    async markInviteUsed(tokenId: string) {
        return this.prisma.token.update({
            where: { id: tokenId },
            data: { usedAt: new Date() },
        });
    }

    async countPendingInvites(employerId: string): Promise<number> {
        return this.prisma.token.count({
            where: {
                employerId,
                type: TokenType.EMPLOYER_INVITE,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
    }
}
