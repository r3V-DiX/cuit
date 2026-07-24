// admin-app/src/modules/roles/roles.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { CreateRoleDto, RoleListQueryDto, UpdateRoleDto } from './dto/roles.dto';

const ROLE_SELECT = {
    id: true,
    name: true,
    description: true,
    domainId: true,
    domain: { select: { id: true, name: true } },
    isActive: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.RoleSelect;

@Injectable()
export class RolesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: RoleListQueryDto) {
        const { page = 1, limit = 20, isActive, domainId, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.RoleWhereInput = {
            ...(isActive !== undefined ? { isActive } : {}),
            ...(domainId ? { domainId } : {}),
            ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.role.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                select: ROLE_SELECT,
            }),
            this.prisma.role.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findById(id: string) {
        return this.prisma.role.findUnique({ where: { id }, select: ROLE_SELECT });
    }

    async create(dto: CreateRoleDto) {
        return this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
                domainId: dto.domainId ?? undefined,
            },
            select: ROLE_SELECT,
        });
    }

    async update(id: string, dto: UpdateRoleDto) {
        return this.prisma.role.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.domainId !== undefined ? { domainId: dto.domainId } : {}),
            },
            select: ROLE_SELECT,
        });
    }

    async setActive(id: string, isActive: boolean) {
        return this.prisma.role.update({ where: { id }, data: { isActive }, select: ROLE_SELECT });
    }

    async countJobsUsingRole(id: string): Promise<number> {
        return this.prisma.job.count({ where: { roleId: id } });
    }

    async delete(id: string) {
        return this.prisma.role.delete({ where: { id } });
    }
}
