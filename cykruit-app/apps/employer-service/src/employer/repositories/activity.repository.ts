import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';

export interface ActivityQuery {
    page?: number;
    limit?: number;
    module?: string;
    riskLevel?: string;
    result?: string;
    search?: string;
    from?: string;
    to?: string;
}

@Injectable()
export class ActivityRepository {
    constructor(private readonly prisma: PrismaService) {}

    private async getMemberIds(userId: string): Promise<string[]> {
        const member = await this.prisma.employerMember.findFirst({
            where: { userId },
            select: { employerId: true },
        });
        if (!member) return [];
        const members = await this.prisma.employerMember.findMany({
            where: { employerId: member.employerId },
            select: { userId: true },
        });
        return members.map((m) => m.userId);
    }

    async findSystemLogs(userId: string, query: ActivityQuery) {
        const { page = 1, limit = 50, module, riskLevel, result, search, from, to } = query;
        const safeLimit = Math.min(limit, 100);
        const skip = (page - 1) * safeLimit;

        const memberIds = await this.getMemberIds(userId);
        if (!memberIds.length) return { items: [], total: 0 };

        const where: Prisma.AuditLogWhereInput = {
            actorId: { in: memberIds },
            ...(module     ? { module }     : {}),
            ...(riskLevel  ? { riskLevel }  : {}),
            ...(result     ? { result }     : {}),
            ...(from || to ? { createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to   ? { lte: new Date(to)   } : {}),
            }} : {}),
            ...(search ? { OR: [
                { action: { contains: search, mode: 'insensitive' as const } },
                { module: { contains: search, mode: 'insensitive' as const } },
                { reason: { contains: search, mode: 'insensitive' as const } },
                { actor:  { email:     { contains: search, mode: 'insensitive' as const } } },
                { actor:  { firstName: { contains: search, mode: 'insensitive' as const } } },
            ]} : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: safeLimit,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { items, total };
    }

    async findAuthLogs(userId: string, query: ActivityQuery) {
        const { page = 1, limit = 50, search, from, to } = query;
        const safeLimit = Math.min(limit, 100);
        const skip = (page - 1) * safeLimit;

        const memberIds = await this.getMemberIds(userId);
        if (!memberIds.length) return { items: [], total: 0 };

        const where: Prisma.AuthAuditLogWhereInput = {
            userId: { in: memberIds },
            ...(from || to ? { createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to   ? { lte: new Date(to)   } : {}),
            }} : {}),
            ...(search ? { OR: [
                { action:    { contains: search, mode: 'insensitive' as const } },
                { ipAddress: { contains: search, mode: 'insensitive' as const } },
                { user: { email:     { contains: search, mode: 'insensitive' as const } } },
                { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
            ]} : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.authAuditLog.findMany({
                where,
                skip,
                take: safeLimit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, email: true, firstName: true, lastName: true } },
                },
            }),
            this.prisma.authAuditLog.count({ where }),
        ]);

        return { items, total };
    }
}
