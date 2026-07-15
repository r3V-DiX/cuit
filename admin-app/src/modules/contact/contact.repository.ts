// admin-app/src/admin/repositories/contact.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { ContactListQueryDto } from './dto/contact.dto';

const CONTACT_SELECT = {
    id: true,
    fullName: true,
    email: true,
    message: true,
    status: true,
    reviewedBy: true,
    reviewedAt: true,
    notes: true,
    ipAddress: true,
    userAgent: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ContactFormSelect;

@Injectable()
export class ContactRepository {
    constructor(private readonly prisma: PrismaService) {}

    async list(query: ContactListQueryDto) {
        const { page = 1, limit = 20, q, status } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ContactFormWhereInput = {
            ...(status ? { status } : {}),
            ...(q
                ? {
                      OR: [
                          { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
                          { fullName: { contains: q, mode: Prisma.QueryMode.insensitive } },
                      ],
                  }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.contactForm.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: CONTACT_SELECT,
            }),
            this.prisma.contactForm.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: string) {
        return this.prisma.contactForm.findUnique({ where: { id }, select: CONTACT_SELECT });
    }

    async updateStatus(id: string, status: string, adminId: string, notes?: string) {
        return this.prisma.contactForm.update({
            where: { id },
            data: {
                status,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                ...(notes !== undefined ? { notes } : {}),
            },
            select: CONTACT_SELECT,
        });
    }
}
