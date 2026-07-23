// admin-app/src/modules/domains/domains.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { CreateDomainDto, DomainListQueryDto, UpdateDomainDto } from './dto/domains.dto';

const DOMAIN_SELECT = {
    id: true,
    name: true,
    slug: true,
    isActive: true,
    sortOrder: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.JobDomainSelect;

@Injectable()
export class DomainsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: DomainListQueryDto) {
        const { page = 1, limit = 20, isActive, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.JobDomainWhereInput = {
            ...(isActive !== undefined ? { isActive } : {}),
            ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.jobDomain.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                select: DOMAIN_SELECT,
            }),
            this.prisma.jobDomain.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findById(id: string) {
        return this.prisma.jobDomain.findUnique({ where: { id }, select: DOMAIN_SELECT });
    }

    async create(adminId: string, dto: CreateDomainDto) {
        return this.prisma.jobDomain.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                sortOrder: dto.sortOrder ?? 0,
                createdBy: adminId,
            },
            select: DOMAIN_SELECT,
        });
    }

    async update(id: string, dto: UpdateDomainDto) {
        return this.prisma.jobDomain.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
                ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
            },
            select: DOMAIN_SELECT,
        });
    }

    async setActive(id: string, isActive: boolean) {
        return this.prisma.jobDomain.update({ where: { id }, data: { isActive }, select: DOMAIN_SELECT });
    }

    async countRolesUsingDomain(id: string): Promise<number> {
        return this.prisma.role.count({ where: { domainId: id } });
    }

    async delete(id: string) {
        return this.prisma.jobDomain.delete({ where: { id } });
    }
}
