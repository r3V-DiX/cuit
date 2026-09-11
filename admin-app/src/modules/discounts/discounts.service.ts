// admin-app/src/admin/services/discounts.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DiscountsRepository } from './discounts.repository';
import { AdminAuditLogger } from '../../common';
import {
    DiscountListQueryDto,
    CreateDiscountDto,
    UpdateDiscountDto,
    DiscountUsagesQueryDto,
} from './dto/discounts.dto';

@Injectable()
export class DiscountsService {
    constructor(
        private readonly repo: DiscountsRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: DiscountListQueryDto) {
        return this.repo.findAll(query);
    }

    async getById(id: string) {
        const discount = await this.repo.findById(id);
        if (!discount) throw new NotFoundException('Discount not found');
        return discount;
    }

    async create(adminId: string, dto: CreateDiscountDto) {
        if (dto.trigger === 'COUPON_CODE' && !dto.code) {
            throw new BadRequestException('Coupon code is required for COUPON_CODE trigger');
        }
        if (dto.applicability === 'SPECIFIC_PACKAGES' && (!dto.packageIds?.length)) {
            throw new BadRequestException('packageIds required when applicability is SPECIFIC_PACKAGES');
        }

        const created = await this.repo.create(dto, adminId);

        this.auditLogger.log({
            adminId,
            action: 'discounts:create',
            module: 'discounts',
            resource: 'Discount',
            resourceId: created.id,
            newData: { name: dto.name, trigger: dto.trigger, discountType: dto.discountType } as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return created;
    }

    async update(adminId: string, id: string, dto: UpdateDiscountDto) {
        const existing = await this.getById(id);
        const updated = await this.repo.update(id, dto, adminId);

        this.auditLogger.log({
            adminId,
            action: 'discounts:update',
            module: 'discounts',
            resource: 'Discount',
            resourceId: id,
            oldData: { name: existing.name, status: existing.status } as unknown as Prisma.InputJsonValue,
            newData: dto as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async deactivate(adminId: string, id: string) {
        const existing = await this.getById(id);
        if (existing.status === 'INACTIVE') {
            throw new BadRequestException('Discount is already inactive');
        }

        const updated = await this.repo.deactivate(id, adminId);

        this.auditLogger.log({
            adminId,
            action: 'discounts:deactivate',
            module: 'discounts',
            resource: 'Discount',
            resourceId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return updated;
    }

    async reactivate(adminId: string, id: string) {
        const existing = await this.getById(id);
        if (existing.status === 'ACTIVE') {
            throw new BadRequestException('Discount is already active');
        }

        const updated = await this.repo.reactivate(id, adminId);

        this.auditLogger.log({
            adminId,
            action: 'discounts:reactivate',
            module: 'discounts',
            resource: 'Discount',
            resourceId: id,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async delete(adminId: string, id: string) {
        const existing = await this.getById(id);
        if (existing._count.usages > 0) {
            throw new BadRequestException('Cannot delete a discount that has already been used — deactivate it instead');
        }

        await this.repo.delete(id);

        this.auditLogger.log({
            adminId,
            action: 'discounts:delete',
            module: 'discounts',
            resource: 'Discount',
            resourceId: id,
            oldData: { name: existing.name, code: existing.code } as unknown as Prisma.InputJsonValue,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });

        return { id };
    }

    async getUsages(id: string, query: DiscountUsagesQueryDto) {
        await this.getById(id);
        return this.repo.findUsages(id, query);
    }
}
