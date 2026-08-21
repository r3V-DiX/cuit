// admin-app/src/modules/resumes/resumes.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { AdminResumeListQueryDto } from './dto/resumes.dto';

const RESUME_LIST_SELECT = {
    id: true,
    fileName: true,
    fileSize: true,
    fileType: true,
    uploadedAt: true,
    profile: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { id: true, email: true } },
        },
    },
} satisfies Prisma.ResumeSelect;

type ResumeListItem = Prisma.ResumeGetPayload<{ select: typeof RESUME_LIST_SELECT }>;

@Injectable()
export class ResumesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(query: AdminResumeListQueryDto): Promise<{ items: ResumeListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const { page = 1, limit = 20, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ResumeWhereInput = q
            ? {
                  OR: [
                      { fileName: { contains: q, mode: Prisma.QueryMode.insensitive } },
                      { profile: { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                      { profile: { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
                      { profile: { user: { email: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
                  ],
              }
            : {};

        const [items, total] = await this.prisma.$transaction([
            this.prisma.resume.findMany({
                where,
                skip,
                take: limit,
                orderBy: { uploadedAt: 'desc' },
                select: RESUME_LIST_SELECT,
            }),
            this.prisma.resume.count({ where }),
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

    async findFileUrlById(id: string) {
        return this.prisma.resume.findUnique({ where: { id }, select: { id: true, fileUrl: true, fileName: true } });
    }
}
