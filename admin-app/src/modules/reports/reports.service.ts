// admin-app/src/admin/services/reports.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { FlagStatus } from '@prisma/client';
import { ReportsRepository } from './reports.repository';
import { AdminAuditLogger } from '../../common';
import { ReportListQueryDto, ResolveReportDto, DismissReportDto } from './dto/reports.dto';

@Injectable()
export class ReportsService {
    constructor(
        private readonly repo: ReportsRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: ReportListQueryDto) {
        return this.repo.list(query);
    }

    async getById(id: string) {
        const report = await this.repo.getById(id);
        if (!report) throw new NotFoundException('Content report not found');
        return report;
    }

    async resolve(adminId: string, id: string, dto: ResolveReportDto) {
        const existing = await this.getById(id);
        if (
            existing.status === FlagStatus.RESOLVED_REMOVED ||
            existing.status === FlagStatus.RESOLVED_DISMISSED
        ) {
            throw new BadRequestException('Report has already been reviewed');
        }

        const updated = await this.repo.setStatus(id, FlagStatus.RESOLVED_REMOVED, adminId, dto.adminNotes);

        this.auditLogger.log({
            adminId,
            action: 'reports:resolve',
            module: 'reports',
            resource: 'ContentReport',
            resourceId: id,
            oldData: { status: existing.status } as unknown as Prisma.InputJsonValue,
            newData: { status: FlagStatus.RESOLVED_REMOVED } as unknown as Prisma.InputJsonValue,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return updated;
    }

    async dismiss(adminId: string, id: string, dto: DismissReportDto) {
        const existing = await this.getById(id);
        if (
            existing.status === FlagStatus.RESOLVED_REMOVED ||
            existing.status === FlagStatus.RESOLVED_DISMISSED
        ) {
            throw new BadRequestException('Report has already been reviewed');
        }

        const updated = await this.repo.setStatus(id, FlagStatus.RESOLVED_DISMISSED, adminId, dto.adminNotes);

        this.auditLogger.log({
            adminId,
            action: 'reports:dismiss',
            module: 'reports',
            resource: 'ContentReport',
            resourceId: id,
            oldData: { status: existing.status } as unknown as Prisma.InputJsonValue,
            newData: { status: FlagStatus.RESOLVED_DISMISSED } as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }
}
