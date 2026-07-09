// admin-app/src/admin/repositories/audit.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { AuditLogQueryDto, AuthAuditLogQueryDto } from '../dto/audit.dto';

@Injectable()
export class AuditRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AuditLogQueryDto): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 50, riskLevel, result, actorRole, module, actorId, targetId, search, from, to } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AuditLogWhereInput = {
            ...(riskLevel ? { riskLevel } : {}),
            ...(result ? { result } : {}),
            ...(actorRole ? { actorRole } : {}),
            ...(module ? { module } : {}),
            ...(actorId ? { actorId } : {}),
            ...(targetId ? { targetId } : {}),
            ...(from || to ? {
                createdAt: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(to) } : {}),
                },
            } : {}),
            ...(search ? {
                OR: [
                    { action: { contains: search, mode: 'insensitive' as const } },
                    { module: { contains: search, mode: 'insensitive' as const } },
                    { reason: { contains: search, mode: 'insensitive' as const } },
                    { actor: { email: { contains: search, mode: 'insensitive' as const } } },
                    { actor: { firstName: { contains: search, mode: 'insensitive' as const } } },
                ],
            } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: {
                        select: { id: true, email: true, firstName: true, lastName: true, role: true },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { items, total };
    }

    async findAuthLogs(query: AuthAuditLogQueryDto): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 50, status, action, userId, search, from, to } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AuthAuditLogWhereInput = {
            ...(status ? { status } : {}),
            ...(action ? { action } : {}),
            ...(userId ? { userId } : {}),
            ...(from || to ? {
                createdAt: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(to) } : {}),
                },
            } : {}),
            ...(search ? {
                OR: [
                    { action: { contains: search, mode: 'insensitive' as const } },
                    { ipAddress: { contains: search, mode: 'insensitive' as const } },
                    { user: { email: { contains: search, mode: 'insensitive' as const } } },
                    { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
                ],
            } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.authAuditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true, firstName: true, lastName: true, role: true },
                    },
                },
            }),
            this.prisma.authAuditLog.count({ where }),
        ]);

        return { items, total };
    }
}
