// apps/seeker-service/src/seeker/repositories/saved-jobs.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';
import { SavedJobListQueryDto } from '../dto/saved-job.dto';

const SAVED_JOB_INCLUDE = {
    job: {
        include: {
            employer: {
                select: {
                    id: true,
                    companyName: true,
                    slug: true,
                    companyLogo: true,
                    isVerified: true,
                },
            },
            location: true,
            role: true,
            skills: { include: { skill: { select: { id: true, name: true } } } },
        },
    },
} satisfies Prisma.SavedJobInclude;

@Injectable()
export class SavedJobsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findBySeekerAndJob(seekerId: string, jobId: string) {
        return this.prisma.savedJob.findUnique({
            where: { seekerId_jobId: { seekerId, jobId } },
        });
    }

    async findBySeeker(
        seekerId: string,
        query: SavedJobListQueryDto,
    ): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.SavedJobWhereInput = { seekerId };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.savedJob.findMany({
                where,
                skip,
                take: limit,
                orderBy: { savedAt: 'desc' },
                include: SAVED_JOB_INCLUDE,
            }),
            this.prisma.savedJob.count({ where }),
        ]);

        return { items, total };
    }

    async save(seekerId: string, jobId: string, note?: string) {
        // upsert handles concurrent duplicate requests gracefully
        return this.prisma.savedJob.upsert({
            where: { seekerId_jobId: { seekerId, jobId } },
            create: { seekerId, jobId, note },
            update: { note },
            include: SAVED_JOB_INCLUDE,
        });
    }

    async remove(seekerId: string, jobId: string) {
        return this.prisma.savedJob.delete({
            where: { seekerId_jobId: { seekerId, jobId } },
        });
    }
}
