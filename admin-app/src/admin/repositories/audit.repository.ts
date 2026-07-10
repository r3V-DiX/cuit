// admin-app/src/admin/repositories/audit.repository.ts
//
// Three query methods, one per audit-logs tab:
//   findAdminActivityLogs → AdminAuditLog   (Tab 3: Admin Activity Logs)
//   findUnifiedAuthLogs   → AuthAuditLog + AdminAuthAuditLog, merged via SQL UNION ALL (Tab 1: Audit Logs)
//   findSystemLogs        → AuditLog        (Tab 2: System Logs)

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { AdminActivityLogQueryDto, UnifiedAuthLogQueryDto, SystemAuditLogQueryDto } from '../dto/audit.dto';

interface UnifiedAuthLogRow {
    id: string;
    action: string;
    status: string;
    createdAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: unknown;
    source: 'MAIN_APP' | 'ADMIN_CONSOLE';
    actorId: string | null;
    actorEmail: string | null;
    actorFirstName: string | null;
    actorLastName: string | null;
}

@Injectable()
export class AuditRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAdminActivityLogs(query: AdminActivityLogQueryDto): Promise<{ items: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 50, riskLevel, result, module, adminId, resource, resourceId, search, from, to, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AdminAuditLogWhereInput = {
            ...(riskLevel ? { riskLevel } : {}),
            ...(result ? { result } : {}),
            ...(module ? { module } : {}),
            ...(adminId ? { adminId } : {}),
            ...(resource ? { resource } : {}),
            ...(resourceId ? { resourceId } : {}),
            ...(from || to
                ? {
                      createdAt: {
                          ...(from ? { gte: new Date(from) } : {}),
                          ...(to ? { lte: new Date(to) } : {}),
                      },
                  }
                : {}),
            ...(search
                ? {
                      OR: [
                          { action: { contains: search, mode: 'insensitive' as const } },
                          { module: { contains: search, mode: 'insensitive' as const } },
                          { reason: { contains: search, mode: 'insensitive' as const } },
                          { admin: { email: { contains: search, mode: 'insensitive' as const } } },
                          { admin: { firstName: { contains: search, mode: 'insensitive' as const } } },
                      ],
                  }
                : {}),
        };

        const orderBy: Prisma.AdminAuditLogOrderByWithRelationInput =
            sortBy === 'riskLevel' ? { riskLevel: sortOrder ?? 'desc' } : { createdAt: sortOrder ?? 'desc' };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.adminAuditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    admin: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
            }),
            this.prisma.adminAuditLog.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findSystemLogs(query: SystemAuditLogQueryDto): Promise<{ items: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 50, module, riskLevel, result, actorId, targetType, targetId, search, from, to, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AuditLogWhereInput = {
            ...(module ? { module } : {}),
            ...(riskLevel ? { riskLevel } : {}),
            ...(result ? { result } : {}),
            ...(actorId ? { actorId } : {}),
            ...(targetType ? { targetType } : {}),
            ...(targetId ? { targetId } : {}),
            ...(from || to
                ? {
                      createdAt: {
                          ...(from ? { gte: new Date(from) } : {}),
                          ...(to ? { lte: new Date(to) } : {}),
                      },
                  }
                : {}),
            ...(search
                ? {
                      OR: [
                          { action: { contains: search, mode: 'insensitive' as const } },
                          { module: { contains: search, mode: 'insensitive' as const } },
                          { reason: { contains: search, mode: 'insensitive' as const } },
                          { actor: { email: { contains: search, mode: 'insensitive' as const } } },
                          { actor: { firstName: { contains: search, mode: 'insensitive' as const } } },
                      ],
                  }
                : {}),
        };

        const orderBy: Prisma.AuditLogOrderByWithRelationInput =
            sortBy === 'riskLevel' ? { riskLevel: sortOrder ?? 'desc' } : { createdAt: sortOrder ?? 'desc' };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    actor: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findUnifiedAuthLogs(query: UnifiedAuthLogQueryDto): Promise<{ items: UnifiedAuthLogRow[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 50, source, status, action, search, from, to, sortOrder } = query;
        const skip = (page - 1) * limit;
        const order = sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;

        const mainAppFilters: Prisma.Sql[] = [];
        const adminConsoleFilters: Prisma.Sql[] = [];

        if (status) {
            mainAppFilters.push(Prisma.sql`a.status = ${status}`);
            adminConsoleFilters.push(Prisma.sql`b.status = ${status}`);
        }
        if (action) {
            mainAppFilters.push(Prisma.sql`a.action ILIKE ${`%${action}%`}`);
            adminConsoleFilters.push(Prisma.sql`b.action ILIKE ${`%${action}%`}`);
        }
        if (from) {
            mainAppFilters.push(Prisma.sql`a."createdAt" >= ${new Date(from)}`);
            adminConsoleFilters.push(Prisma.sql`b."createdAt" >= ${new Date(from)}`);
        }
        if (to) {
            mainAppFilters.push(Prisma.sql`a."createdAt" <= ${new Date(to)}`);
            adminConsoleFilters.push(Prisma.sql`b."createdAt" <= ${new Date(to)}`);
        }
        if (search) {
            const like = `%${search}%`;
            mainAppFilters.push(Prisma.sql`(a.action ILIKE ${like} OR a."ipAddress" ILIKE ${like} OR u.email ILIKE ${like} OR u."firstName" ILIKE ${like})`);
            adminConsoleFilters.push(Prisma.sql`(b.action ILIKE ${like} OR b."ipAddress" ILIKE ${like} OR ad.email ILIKE ${like} OR ad."firstName" ILIKE ${like})`);
        }

        const mainAppWhere = mainAppFilters.length ? Prisma.sql`WHERE ${Prisma.join(mainAppFilters, ' AND ')}` : Prisma.empty;
        const adminConsoleWhere = adminConsoleFilters.length ? Prisma.sql`WHERE ${Prisma.join(adminConsoleFilters, ' AND ')}` : Prisma.empty;

        const mainAppBranch = Prisma.sql`
            SELECT a.id, a.action, a.status, a."createdAt", a."ipAddress", a."userAgent", a.metadata,
                   'MAIN_APP' AS source, a."userId" AS "actorId",
                   u.email AS "actorEmail", u."firstName" AS "actorFirstName", u."lastName" AS "actorLastName"
            FROM auth_audit_logs a
            LEFT JOIN users u ON u.id = a."userId"
            ${mainAppWhere}
        `;

        const adminConsoleBranch = Prisma.sql`
            SELECT b.id, b.action, b.status, b."createdAt", b."ipAddress", b."userAgent", b.metadata,
                   'ADMIN_CONSOLE' AS source, b."adminId"::text AS "actorId",
                   ad.email AS "actorEmail", ad."firstName" AS "actorFirstName", ad."lastName" AS "actorLastName"
            FROM admin_auth_audit_logs b
            LEFT JOIN admins ad ON ad.id = b."adminId"
            ${adminConsoleWhere}
        `;

        let combined: Prisma.Sql;
        if (source === 'MAIN_APP') {
            combined = mainAppBranch;
        } else if (source === 'ADMIN_CONSOLE') {
            combined = adminConsoleBranch;
        } else {
            combined = Prisma.sql`${mainAppBranch} UNION ALL ${adminConsoleBranch}`;
        }

        const [items, totalResult] = await Promise.all([
            this.prisma.$queryRaw<UnifiedAuthLogRow[]>(Prisma.sql`
                SELECT * FROM (${combined}) combined
                ORDER BY "createdAt" ${order}
                LIMIT ${limit} OFFSET ${skip}
            `),
            this.prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
                SELECT COUNT(*) AS total FROM (${combined}) combined
            `),
        ]);

        const total = Number(totalResult[0]?.total ?? 0);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}
