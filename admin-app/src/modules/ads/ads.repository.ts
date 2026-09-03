// admin-app/src/modules/ads/ads.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma, Ad } from '@prisma/client';
import { AdminAdsQueryDto, CreateAdDto, UpdateAdDto } from './dto/ads.dto';

export interface PaginatedAdsResult {
    items: Ad[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    metrics: {
        total: number;
        active: number;
        inactive: number;
        slots: number;
    };
}

@Injectable()
export class AdsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AdminAdsQueryDto): Promise<PaginatedAdsResult> {
        const { page = 1, limit = 10, search, slotKey, isActive } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AdWhereInput = {
            ...(isActive !== undefined ? { isActive } : {}),
            ...(slotKey ? { slotKey } : {}),
            ...(search
                ? {
                      OR: [
                          { slotKey: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { altText: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { linkUrl: { contains: search, mode: Prisma.QueryMode.insensitive } },
                      ],
                  }
                : {}),
        };

        const [items, total, totalCount, activeCount, slotsDistinct] = await this.prisma.$transaction([
            this.prisma.ad.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.ad.count({ where }),
            this.prisma.ad.count(),
            this.prisma.ad.count({ where: { isActive: true } }),
            this.prisma.ad.findMany({
                select: { slotKey: true },
                distinct: ['slotKey'],
            }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
            metrics: {
                total: totalCount,
                active: activeCount,
                inactive: totalCount - activeCount,
                slots: slotsDistinct.length,
            },
        };
    }

    async findById(id: string): Promise<Ad | null> {
        return this.prisma.ad.findUnique({ where: { id } });
    }

    async create(data: CreateAdDto): Promise<Ad> {
        return this.prisma.ad.create({
            data: {
                slotKey: data.slotKey,
                imageUrl: data.imageUrl,
                linkUrl: data.linkUrl,
                altText: data.altText,
                isActive: data.isActive ?? true,
            },
        });
    }

    async update(id: string, data: UpdateAdDto): Promise<Ad> {
        return this.prisma.ad.update({
            where: { id },
            data: {
                ...(data.slotKey !== undefined ? { slotKey: data.slotKey } : {}),
                ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
                ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl } : {}),
                ...(data.altText !== undefined ? { altText: data.altText } : {}),
                ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            },
        });
    }

    async delete(id: string): Promise<Ad> {
        return this.prisma.ad.delete({ where: { id } });
    }

    async setActive(id: string, isActive: boolean): Promise<Ad> {
        return this.prisma.ad.update({
            where: { id },
            data: { isActive },
        });
    }
}
