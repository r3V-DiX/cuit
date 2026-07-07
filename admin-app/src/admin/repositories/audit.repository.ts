// admin-app/src/admin/repositories/audit.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { AuditLogQueryDto } from '../dto/audit.dto';
// riskLevel and result are plain strings in AuditLog model

@Injectable()
export class AuditRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AuditLogQueryDto): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 50, riskLevel, result, actorRole, module, actorId, targetId } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AuditLogWhereInput = {
            ...(riskLevel ? { riskLevel } : {}),
            ...(result ? { result } : {}),
            ...(actorRole ? { actorRole } : {}),
            ...(module ? { module } : {}),
            ...(actorId ? { actorId } : {}),
            ...(targetId ? { targetId } : {}),
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
}
