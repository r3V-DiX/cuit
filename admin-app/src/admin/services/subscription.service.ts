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

@Injectable()
export class SubscriptionService {
    constructor(private readonly repository: SubscriptionRepository) {}

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

    async assignSubscription(dto: AssignSubscriptionDto) {
        return this.repository.assignSubscription(dto.employerId, dto.packageId, dto.status ?? 'ACTIVE');
    }

    async getEmployerSubscription(employerId: string) {
        return this.repository.findSubscriptionByEmployer(employerId);
    }

    async updateSubscriptionStatus(id: string, status: string) {
        return this.repository.updateSubscriptionStatus(id, status);
    }
}
