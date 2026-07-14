// apps/subscription-service/src/subscription/services/packages.service.ts

import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class PackagesService {
    constructor(
        private readonly repo: SubscriptionRepository,
    ) {}

    /** Public — only active packages visible to employers. */
    async listActive() {
        const { items } = await this.repo.findAllPackages({ isActive: true, limit: 100 });
        return items;
    }

    async getById(id: string) {
        const pkg = await this.repo.findPackageById(id);
        if (!pkg) throw new NotFoundException('Package not found');
        return pkg;
    }
}
