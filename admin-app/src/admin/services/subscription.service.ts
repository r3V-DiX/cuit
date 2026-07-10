// admin-app/src/admin/services/subscription.service.ts
// Admin-app owns subscription data locally and uses the Prisma-backed repository.

import { Injectable } from '@nestjs/common';
import {
    CreatePackageDto,
    UpdatePackageDto,
    AssignSubscriptionDto,
    SubscriptionListQueryDto,
} from '../dto/subscription.dto';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { AdminAuditLogger } from './admin-audit.logger';

@Injectable()
export class SubscriptionService {
    constructor(
        private readonly repository: SubscriptionRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    // ── Packages ──────────────────────────────────────────────────────────────

    async listPackages(query: { isActive?: boolean; page?: number; limit?: number } = {}) {
        return this.repository.findAllPackages(query);
    }

    async getPackage(id: string) {
        return this.repository.findPackageById(id);
    }

    async createPackage(dto: CreatePackageDto) {
        return this.repository.createPackage(dto);
    }

    async updatePackage(id: string, dto: UpdatePackageDto) {
        return this.repository.updatePackage(id, dto);
    }

    async deletePackage(id: string) {
        return this.repository.deletePackage(id);
    }

    // ── Employer subscriptions ────────────────────────────────────────────────

    async listSubscriptions(query: SubscriptionListQueryDto) {
        return this.repository.findAllSubscriptions(query);
    }

    async getSubscriptionById(id: string) {
        return this.repository.findSubscriptionById(id);
    }

    async assignSubscription(adminId: string, dto: AssignSubscriptionDto) {
        const result = await this.repository.assignSubscription(dto.employerId, dto.packageId, dto.status ?? 'ACTIVE');
        this.auditLogger.log({
            adminId,
            action: 'subscription:assign',
            module: 'subscription',
            resource: 'EmployerSubscription',
            resourceId: result.id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });
        return result;
    }

    async getEmployerSubscription(employerId: string) {
        return this.repository.findSubscriptionByEmployer(employerId);
    }

    async updateSubscriptionStatus(adminId: string, id: string, status: string) {
        const result = await this.repository.updateSubscriptionStatus(id, status);
        this.auditLogger.log({
            adminId,
            action: 'subscription:update-status',
            module: 'subscription',
            resource: 'EmployerSubscription',
            resourceId: id,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
            metadata: { newStatus: status },
        });
        return result;
    }
}
