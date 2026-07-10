// admin-app/src/admin/repositories/testimonials.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { AdminTestimonialsQueryDto, CreateTestimonialDto, UpdateTestimonialDto } from '../dto/testimonials.dto';

@Injectable()
export class TestimonialsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AdminTestimonialsQueryDto): Promise<{ items: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 20, type, published, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TestimonialWhereInput = {
            ...(type ? { type } : {}),
            ...(published !== undefined ? { isPublished: published } : {}),
            ...(q
                ? {
                      OR: [
                          { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
                          { company: { contains: q, mode: Prisma.QueryMode.insensitive } },
                          { role: { contains: q, mode: Prisma.QueryMode.insensitive } },
                      ],
                  }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.testimonial.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            }),
            this.prisma.testimonial.count({ where }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findById(id: string) {
        return this.prisma.testimonial.findUnique({ where: { id } });
    }

    async create(data: CreateTestimonialDto) {
        return this.prisma.testimonial.create({ data });
    }

    async update(id: string, data: UpdateTestimonialDto) {
        return this.prisma.testimonial.update({ where: { id }, data });
    }

    async delete(id: string) {
        return this.prisma.testimonial.delete({ where: { id } });
    }

    async setPublished(id: string, isPublished: boolean) {
        return this.prisma.testimonial.update({ where: { id }, data: { isPublished } });
    }
}
