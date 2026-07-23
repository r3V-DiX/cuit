// admin-app/src/modules/export/export.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import type { AccountStatus, JobStatus, Prisma, UserRole } from '@prisma/client';
import { AdminAuditLogger } from '../../common';
import { ExportApplicationsQueryDto, ExportJobsQueryDto, ExportUsersQueryDto } from './dto/export.dto';

function csvEscape(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
    const lines = rows.map((row) => columns.map((c) => csvEscape(row[c])).join(','));
    return [columns.join(','), ...lines].join('\n');
}

@Injectable()
export class ExportService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    private audit(adminId: string, entity: string, rowCount: number) {
        this.auditLogger.log({
            adminId,
            action: 'export:run',
            module: 'export',
            resource: entity,
            newData: { rowCount } as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });
    }

    async exportUsers(adminId: string, query: ExportUsersQueryDto): Promise<string> {
        const where: Prisma.UserWhereInput = {
            ...(query.status ? { status: query.status as AccountStatus } : {}),
            ...(query.role ? { role: query.role as UserRole } : {}),
        };

        const users = await this.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true, createdAt: true },
        });

        this.audit(adminId, 'User', users.length);

        return toCsv(
            ['id', 'name', 'email', 'role', 'status', 'createdAt'],
            users.map((u) => ({
                id: u.id,
                name: `${u.firstName} ${u.lastName}`,
                email: u.email,
                role: u.role,
                status: u.status,
                createdAt: u.createdAt.toISOString(),
            })),
        );
    }

    async exportJobs(adminId: string, query: ExportJobsQueryDto): Promise<string> {
        const where: Prisma.JobWhereInput = {
            ...(query.status ? { status: query.status as JobStatus } : {}),
        };

        const jobs = await this.prisma.job.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                jobTitle: true,
                status: true,
                createdAt: true,
                employer: { select: { companyName: true } },
            },
        });

        this.audit(adminId, 'Job', jobs.length);

        return toCsv(
            ['id', 'title', 'company', 'status', 'createdAt'],
            jobs.map((j) => ({
                id: j.id,
                title: j.jobTitle ?? '',
                company: j.employer.companyName,
                status: j.status,
                createdAt: j.createdAt.toISOString(),
            })),
        );
    }

    async exportApplications(adminId: string, query: ExportApplicationsQueryDto): Promise<string> {
        const where: Prisma.ApplicationWhereInput = {
            ...(query.from || query.to
                ? {
                      appliedAt: {
                          ...(query.from ? { gte: new Date(query.from) } : {}),
                          ...(query.to ? { lte: new Date(query.to) } : {}),
                      },
                  }
                : {}),
        };

        const applications = await this.prisma.application.findMany({
            where,
            orderBy: { appliedAt: 'desc' },
            select: {
                id: true,
                status: true,
                appliedAt: true,
                job: { select: { jobTitle: true } },
                jobSeeker: { select: { firstName: true, lastName: true, email: true } },
            },
        });

        this.audit(adminId, 'Application', applications.length);

        return toCsv(
            ['id', 'jobTitle', 'applicantName', 'applicantEmail', 'status', 'appliedAt'],
            applications.map((a) => ({
                id: a.id,
                jobTitle: a.job.jobTitle ?? '',
                applicantName: `${a.jobSeeker.firstName} ${a.jobSeeker.lastName}`,
                applicantEmail: a.jobSeeker.email,
                status: a.status,
                appliedAt: a.appliedAt.toISOString(),
            })),
        );
    }

    async exportSubscriptions(adminId: string): Promise<string> {
        const subscriptions = await this.prisma.employerSubscription.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                billingCycle: true,
                startedAt: true,
                expiresAt: true,
                employer: { select: { companyName: true } },
                package: { select: { name: true } },
            },
        });

        this.audit(adminId, 'EmployerSubscription', subscriptions.length);

        return toCsv(
            ['id', 'company', 'package', 'status', 'billingCycle', 'startedAt', 'expiresAt'],
            subscriptions.map((s) => ({
                id: s.id,
                company: s.employer.companyName,
                package: s.package.name,
                status: s.status,
                billingCycle: s.billingCycle ?? '',
                startedAt: s.startedAt.toISOString(),
                expiresAt: s.expiresAt ? s.expiresAt.toISOString() : '',
            })),
        );
    }
}
