// admin-app/src/modules/blacklist/blacklist.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { BlacklistType, Prisma } from '@prisma/client';
import { BlacklistEntryDto, BlacklistListQueryDto } from './dto/blacklist.dto';

const BLACKLIST_SELECT = {
    id: true,
    value: true,
    type: true,
    reason: true,
    addedBy: true,
    createdAt: true,
} satisfies Prisma.BlacklistSelect;

@Injectable()
export class BlacklistRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: BlacklistListQueryDto) {
        const { page = 1, limit = 20, type, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.BlacklistWhereInput = {
            ...(type ? { type: type as BlacklistType } : {}),
            ...(q ? { value: { contains: q, mode: Prisma.QueryMode.insensitive } } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.blacklist.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: BLACKLIST_SELECT,
            }),
            this.prisma.blacklist.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async create(adminId: string, entry: BlacklistEntryDto) {
        return this.prisma.blacklist.create({
            data: {
                value: entry.value.trim().toLowerCase(),
                type: entry.type as BlacklistType,
                reason: entry.reason,
                addedBy: adminId,
            },
            select: BLACKLIST_SELECT,
        });
    }

    async bulkCreate(adminId: string, entries: BlacklistEntryDto[]) {
        return this.prisma.blacklist.createMany({
            data: entries.map((entry) => ({
                value: entry.value.trim().toLowerCase(),
                type: entry.type as BlacklistType,
                reason: entry.reason,
                addedBy: adminId,
            })),
            skipDuplicates: true,
        });
    }

    async findById(id: string) {
        return this.prisma.blacklist.findUnique({ where: { id }, select: BLACKLIST_SELECT });
    }

    async delete(id: string) {
        return this.prisma.blacklist.delete({ where: { id } });
    }
}
