// admin-app/src/admin/services/subscription.service.ts

import { Injectable, Inject, Optional } from '@nestjs/common';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import {
    CreatePackageDto,
    UpdatePackageDto,
    AssignSubscriptionDto,
    SubscriptionListQueryDto,
} from './dto/subscription.dto';
import { SubscriptionRepository } from './subscription.repository';
import { AdminAuditLogger } from '../../common';

@Injectable()
export class SubscriptionService {
    constructor(
        private readonly repository: SubscriptionRepository,
        private readonly auditLogger: AdminAuditLogger,
        @Optional() @Inject(getRedisConnectionToken()) private readonly redis: { del: (key: string) => Promise<unknown> } | null,
    ) {}

    private async invalidateLimitsCache(employerId: string): Promise<void> {
        if (!this.redis) return;
        try {
            await this.redis.del(`employer-limits:${employerId}`);
        } catch {
            // non-fatal
        }
    }

    // ── Packages ──────────────────────────────────────────────────────────────

    async listPackages(query: { isActive?: boolean; page?: number; limit?: number } = {}) {
        return this.repository.findAllPackages(query);
    }

    async getPackage(id: string) {
        return this.repository.findPackageById(id);
    }

    async createPackage(adminId: string, dto: CreatePackageDto) {
        const result = await this.repository.createPackage(dto);
        this.auditLogger.log({
            adminId,
            action: 'subscription:create-package',
            module: 'subscription',
            resource: 'SubscriptionPackage',
            resourceId: result.id,
            newData: JSON.parse(JSON.stringify(dto)),
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });
        return result;
    }

    async updatePackage(adminId: string, id: string, dto: UpdatePackageDto) {
        const result = await this.repository.updatePackage(id, dto);
        this.auditLogger.log({
            adminId,
            action: 'subscription:update-package',
            module: 'subscription',
            resource: 'SubscriptionPackage',
            resourceId: id,
            newData: JSON.parse(JSON.stringify(dto)),
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });
        return result;
    }

    async deletePackage(adminId: string, id: string) {
        const result = await this.repository.deletePackage(id);
        this.auditLogger.log({
            adminId,
            action: 'subscription:delete-package',
            module: 'subscription',
            resource: 'SubscriptionPackage',
            resourceId: id,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });
        return result;
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
        await this.invalidateLimitsCache(dto.employerId);
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

    async listPaymentOrders(query: { employerId?: string; page?: number; limit?: number }) {
        return this.repository.findPaymentOrders(query);
    }

    async getPaymentOrder(id: string) {
        return this.repository.findPaymentOrderById(id);
    }

    async refreshUsage(adminId: string, employerId: string) {
        const result = await this.repository.refreshEmployerUsage(employerId);
        this.auditLogger.log({
            adminId,
            action: 'subscription:refresh-usage',
            module: 'subscription',
            resource: 'EmployerSubscription',
            resourceId: employerId,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });
        return result;
    }

    async updateSubscriptionStatus(adminId: string, id: string, status: string) {
        const result = await this.repository.updateSubscriptionStatus(id, status);
        await this.invalidateLimitsCache(result.employerId);
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
