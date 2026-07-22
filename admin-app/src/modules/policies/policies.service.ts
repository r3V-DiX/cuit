// admin-app/src/modules/policies/policies.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { invalidatePolicyCache } from '@cykruit/policy-config';
import { PoliciesRepository } from './policies.repository';
import { AdminAuditLogger } from '../../common';
import { UpdatePolicyDto } from './dto/policies.dto';
import { POLICY_DEFAULTS } from './policies.constants';

const INTEGER_PATTERN = /^-?\d+$/;

@Injectable()
export class PoliciesService {
    constructor(
        private readonly repo: PoliciesRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list() {
        return this.repo.findAll();
    }

    async update(adminId: string, key: string, dto: UpdatePolicyDto) {
        const existing = await this.repo.findByKey(key);
        if (!existing) throw new NotFoundException(`Unknown policy key: ${key}`);

        this.validateValueForType(existing.type, dto.value);

        const updated = await this.repo.updateValue(key, dto.value, adminId);
        await invalidatePolicyCache(key);

        this.auditLogger.log({
            adminId,
            action: 'policies:update',
            module: 'policies',
            resource: 'PolicyConfig',
            resourceId: updated.id,
            oldData: { key, value: existing.value } as unknown as Prisma.InputJsonValue,
            newData: { key, value: dto.value } as unknown as Prisma.InputJsonValue,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });

        return updated;
    }

    async resetToDefault(adminId: string, key: string) {
        const existing = await this.repo.findByKey(key);
        if (!existing) throw new NotFoundException(`Unknown policy key: ${key}`);

        const seedDefault = POLICY_DEFAULTS.find((d) => d.key === key);
        if (!seedDefault) throw new NotFoundException(`No seeded default for policy key: ${key}`);

        const updated = await this.repo.updateValue(key, seedDefault.value, adminId);
        await invalidatePolicyCache(key);

        this.auditLogger.log({
            adminId,
            action: 'policies:reset',
            module: 'policies',
            resource: 'PolicyConfig',
            resourceId: updated.id,
            oldData: { key, value: existing.value } as unknown as Prisma.InputJsonValue,
            newData: { key, value: seedDefault.value } as unknown as Prisma.InputJsonValue,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });

        return updated;
    }

    private validateValueForType(type: string, value: string): void {
        if (type === 'integer' && !INTEGER_PATTERN.test(value)) {
            throw new BadRequestException(`Value must be an integer for this policy key`);
        }
        if (type === 'boolean' && value !== 'true' && value !== 'false') {
            throw new BadRequestException(`Value must be "true" or "false" for this policy key`);
        }
    }
}
