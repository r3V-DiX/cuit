// apps/subscription-service/src/subscription/services/packages.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { AuditService } from '@cykruit/audit';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { CreatePackageDto, UpdatePackageDto } from '../dto/package.dto';
import { PackageListQueryDto } from '../dto/query.dto';

@Injectable()
export class PackagesService {
    constructor(
        private readonly repo: SubscriptionRepository,
        private readonly auditService: AuditService,
    ) {}

    async listAll(query: PackageListQueryDto) {
        const { items, total } = await this.repo.findAllPackages(query);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        return {
            items,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

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

    async create(dto: CreatePackageDto, actorId: string) {
        const existing = await this.repo.findPackageByName(dto.name);
        if (existing) throw new ConflictException(`Package "${dto.name}" already exists`);
        const pkg = await this.repo.createPackage(dto);

        this.auditService.logAction({
            actorId,
            actorRole: 'ADMIN',
            action: 'subscriptions:create_package',
            module: 'SUBSCRIPTIONS',
            targetType: 'SubscriptionPackage',
            targetId: pkg.id,
            newData: { name: pkg.name },
            result: 'SUCCESS',
        });

        return pkg;
    }

    async update(id: string, dto: UpdatePackageDto, actorId: string) {
        const before = await this.getById(id);

        if (dto.name) {
            const existing = await this.repo.findPackageByName(dto.name);
            if (existing && existing.id !== id) {
                throw new ConflictException(`Package name "${dto.name}" already taken`);
            }
        }

        const updated = await this.repo.updatePackage(id, dto);

        this.auditService.logAction({
            actorId,
            actorRole: 'ADMIN',
            action: 'subscriptions:update_package',
            module: 'SUBSCRIPTIONS',
            targetType: 'SubscriptionPackage',
            targetId: id,
            oldData: { name: before.name },
            newData: dto,
            result: 'SUCCESS',
        });

        return updated;
    }

    async delete(id: string, actorId: string) {
        const before = await this.getById(id);

        const activeCount = await this.repo.countSubscriptionsForPackage(id);
        if (activeCount > 0) {
            throw new BadRequestException(
                `Cannot delete package: ${activeCount} active employer(s) still on this plan. Deactivate it instead.`,
            );
        }

        await this.repo.deletePackage(id);

        this.auditService.logAction({
            actorId,
            actorRole: 'ADMIN',
            action: 'subscriptions:delete_package',
            module: 'SUBSCRIPTIONS',
            targetType: 'SubscriptionPackage',
            targetId: id,
            oldData: { name: before.name },
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return { message: 'Package deleted' };
    }
}
