// admin-app/src/modules/announcements/announcements.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { AnnouncementTarget, Prisma } from '@prisma/client';
import { AnnouncementListQueryDto, CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcements.dto';

const ANNOUNCEMENT_SELECT = {
    id: true,
    message: true,
    type: true,
    target: true,
    isActive: true,
    startsAt: true,
    expiresAt: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.AnnouncementSelect;

@Injectable()
export class AnnouncementsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AnnouncementListQueryDto) {
        const { page = 1, limit = 20, target, isActive } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AnnouncementWhereInput = {
            ...(target ? { target: target as AnnouncementTarget } : {}),
            ...(isActive !== undefined ? { isActive } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.announcement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: ANNOUNCEMENT_SELECT,
            }),
            this.prisma.announcement.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findById(id: string) {
        return this.prisma.announcement.findUnique({ where: { id }, select: ANNOUNCEMENT_SELECT });
    }

    async create(adminId: string, dto: CreateAnnouncementDto) {
        return this.prisma.announcement.create({
            data: {
                message: dto.message,
                type: dto.type,
                target: (dto.target as AnnouncementTarget) ?? AnnouncementTarget.ALL,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
                createdBy: adminId,
            },
            select: ANNOUNCEMENT_SELECT,
        });
    }

    async update(id: string, dto: UpdateAnnouncementDto) {
        return this.prisma.announcement.update({
            where: { id },
            data: {
                ...(dto.message !== undefined ? { message: dto.message } : {}),
                ...(dto.type !== undefined ? { type: dto.type } : {}),
                ...(dto.target !== undefined ? { target: dto.target as AnnouncementTarget } : {}),
                ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null } : {}),
                ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null } : {}),
            },
            select: ANNOUNCEMENT_SELECT,
        });
    }

    async delete(id: string) {
        return this.prisma.announcement.delete({ where: { id } });
    }

    async setActive(id: string, isActive: boolean) {
        return this.prisma.announcement.update({
            where: { id },
            data: { isActive },
            select: ANNOUNCEMENT_SELECT,
        });
    }
}
