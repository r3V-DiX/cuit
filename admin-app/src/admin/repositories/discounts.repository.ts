// admin-app/src/admin/repositories/discounts.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { DiscountStatus, Prisma } from '@prisma/client';
import { DiscountListQueryDto, CreateDiscountDto, UpdateDiscountDto, DiscountUsagesQueryDto } from '../dto/discounts.dto';

const DISCOUNT_LIST_SELECT = {
    id: true,
    name: true,
    code: true,
    trigger: true,
    discountType: true,
    value: true,
    maxDiscountCap: true,
    minOrderAmountPaise: true,
    applicability: true,
    billingCycles: true,
    maxTotalUses: true,
    maxUsesPerUser: true,
    startsAt: true,
    expiresAt: true,
    status: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { usages: true } },
} satisfies Prisma.DiscountSelect;

const DISCOUNT_DETAIL_SELECT = {
    ...DISCOUNT_LIST_SELECT,
    conditions: true,
    createdBy: true,
    updatedBy: true,
    packages: {
        select: {
            packageId: true,
            package: { select: { id: true, name: true } },
        },
    },
} satisfies Prisma.DiscountSelect;

@Injectable()
export class DiscountsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: DiscountListQueryDto) {
        const { page = 1, limit = 20, q, status, trigger } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.DiscountWhereInput = {
            ...(status ? { status } : {}),
            ...(trigger ? { trigger } : {}),
            ...(q
                ? {
                      OR: [
                          { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
                          { code: { contains: q, mode: Prisma.QueryMode.insensitive } },
                      ],
                  }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.discount.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: DISCOUNT_LIST_SELECT,
            }),
            this.prisma.discount.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findById(id: string) {
        return this.prisma.discount.findUnique({
            where: { id },
            select: DISCOUNT_DETAIL_SELECT,
        });
    }

    async create(dto: CreateDiscountDto, adminId: string) {
        const { packageIds, conditions, startsAt, expiresAt, ...rest } = dto;

        return this.prisma.discount.create({
            data: {
                ...rest,
                value: new Prisma.Decimal(rest.value),
                billingCycles: rest.billingCycles ?? [],
                startsAt: new Date(startsAt),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                conditions: conditions ? (conditions as Prisma.InputJsonValue) : Prisma.JsonNull,
                createdBy: adminId,
                ...(packageIds?.length
                    ? {
                          packages: {
                              create: packageIds.map((packageId) => ({ packageId })),
                          },
                      }
                    : {}),
            },
            select: DISCOUNT_DETAIL_SELECT,
        });
    }

    async update(id: string, dto: UpdateDiscountDto, adminId: string) {
        const { packageIds, conditions, startsAt, expiresAt, value, ...rest } = dto;

        return this.prisma.$transaction(async (tx) => {
            if (packageIds !== undefined) {
                await tx.discountPackage.deleteMany({ where: { discountId: id } });
            }

            return tx.discount.update({
                where: { id },
                data: {
                    ...rest,
                    ...(value !== undefined ? { value: new Prisma.Decimal(value) } : {}),
                    ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
                    ...(expiresAt !== undefined
                        ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
                        : {}),
                    ...(conditions !== undefined
                        ? { conditions: conditions as Prisma.InputJsonValue }
                        : {}),
                    updatedBy: adminId,
                    ...(packageIds?.length
                        ? {
                              packages: {
                                  create: packageIds.map((packageId) => ({ packageId })),
                              },
                          }
                        : {}),
                },
                select: DISCOUNT_DETAIL_SELECT,
            });
        });
    }

    async deactivate(id: string, adminId: string) {
        return this.prisma.discount.update({
            where: { id },
            data: { status: DiscountStatus.INACTIVE, updatedBy: adminId },
            select: { id: true, status: true },
        });
    }

    async findUsages(id: string, query: DiscountUsagesQueryDto) {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const [items, total] = await this.prisma.$transaction([
            this.prisma.discountUsage.findMany({
                where: { discountId: id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    employerId: true,
                    orderId: true,
                    amountSavedPaise: true,
                    createdAt: true,
                    employer: {
                        select: {
                            id: true,
                            companyName: true,
                            user: { select: { email: true, firstName: true, lastName: true } },
                        },
                    },
                },
            }),
            this.prisma.discountUsage.count({ where: { discountId: id } }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}
