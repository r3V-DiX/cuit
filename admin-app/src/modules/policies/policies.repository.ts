// admin-app/src/modules/policies/policies.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';

const POLICY_SELECT = {
    id: true,
    key: true,
    value: true,
    type: true,
    description: true,
    unit: true,
    updatedBy: true,
    updatedAt: true,
    createdAt: true,
} satisfies Prisma.PolicyConfigSelect;

@Injectable()
export class PoliciesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.policyConfig.findMany({
            orderBy: { key: 'asc' },
            select: POLICY_SELECT,
        });
    }

    async findByKey(key: string) {
        return this.prisma.policyConfig.findUnique({ where: { key }, select: POLICY_SELECT });
    }

    async updateValue(key: string, value: string, adminId: string) {
        return this.prisma.policyConfig.update({
            where: { key },
            data: { value, updatedBy: adminId },
            select: POLICY_SELECT,
        });
    }
}
