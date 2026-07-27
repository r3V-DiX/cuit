import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';

export interface ActivityQuery {
    page?: number;
    limit?: number;
    search?: string;
    from?: string;
    to?: string;
}

@Injectable()
export class ActivityRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAuthLogs(userId: string, query: ActivityQuery) {
        const { page = 1, limit = 50, search, from, to } = query;
        const safeLimit = Math.min(limit, 100);
        const skip = (page - 1) * safeLimit;

        const where: Prisma.AuthAuditLogWhereInput = {
            userId,
            ...(from || to ? { createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to   ? { lte: new Date(to)   } : {}),
            }} : {}),
            ...(search ? { OR: [
                { action:    { contains: search, mode: 'insensitive' as const } },
                { ipAddress: { contains: search, mode: 'insensitive' as const } },
            ]} : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.authAuditLog.findMany({
                where,
                skip,
                take: safeLimit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.authAuditLog.count({ where }),
        ]);

        return { items, total };
    }
}
