// apps/seeker-service/src/seeker/repositories/applications.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { ApplicationListQueryDto } from '../dto/apply-job.dto';

const APPLICATION_INCLUDE = {
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
        },
    },
    resume: { select: { id: true, fileName: true, fileUrl: true } },
    statusHistory: { orderBy: { changedAt: 'desc' as const }, take: 5 },
} satisfies Prisma.ApplicationInclude;

@Injectable()
export class ApplicationsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findBySeekerAndJob(seekerId: string, jobId: string) {
        return this.prisma.application.findUnique({
            where: { jobId_seekerId: { jobId, seekerId } },
        });
    }

    async findByIdAndSeeker(id: string, seekerId: string) {
        return this.prisma.application.findFirst({
            where: { id, seekerId },
            include: APPLICATION_INCLUDE,
        });
    }

    async findBySeeker(
        seekerId: string,
        query: ApplicationListQueryDto,
    ): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 10, status, search, sort = 'newest' } = query;
        // status is now typed as ApplicationStatus (validated by DTO enum check)
        const skip = (page - 1) * limit;

        const where: Prisma.ApplicationWhereInput = {
            seekerId,
            ...(status ? { status } : {}),
            ...(search
                ? {
                      job: {
                          OR: [
                              { jobTitle: { contains: search, mode: 'insensitive' } },
                              { employer: { companyName: { contains: search, mode: 'insensitive' } } },
                          ],
                      },
                  }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.application.findMany({
                where,
                skip,
                take: limit,
                orderBy: { appliedAt: sort === 'oldest' ? 'asc' : 'desc' },
                include: APPLICATION_INCLUDE,
            }),
            this.prisma.application.count({ where }),
        ]);

        return { items, total };
    }

    async create(data: {
        jobId: string;
        seekerId: string;
        resumeId?: string;
        screeningAnswers?: any;
    }) {
        return this.prisma.application.create({
            data: {
                jobId: data.jobId,
                seekerId: data.seekerId,
                ...(data.resumeId ? { resumeId: data.resumeId } : {}),
                ...(data.screeningAnswers ? { screeningAnswers: data.screeningAnswers } : {}),
                status: ApplicationStatus.APPLIED,
            },
            include: APPLICATION_INCLUDE,
        });
    }

    async updateStatus(
        id: string,
        status: ApplicationStatus,
        changedBy: string,
        reason?: string,
        extra?: Prisma.ApplicationUpdateInput,
    ) {
        const current = await this.prisma.application.findUnique({ where: { id }, select: { status: true } });
        if (!current) return null;

        return this.prisma.application.update({
            where: { id },
            data: {
                status,
                ...(extra ?? {}),
                statusHistory: {
                    create: {
                        oldStatus: current.status,
                        newStatus: status,
                        changedBy,
                        reason,
                    },
                },
            },
            include: APPLICATION_INCLUDE,
        });
    }

    async updateAiScore(id: string, aiScore: number, aiScoreData: any) {
        return this.prisma.application.update({
            where: { id },
            data: { aiScore, aiScoreData, aiScoredAt: new Date() },
        });
    }

    async incrementJobApplicationCount(jobId: string) {
        await this.prisma.job.update({
            where: { id: jobId },
            data: { applicationCount: { increment: 1 } },
        }).catch(() => {/* non-critical */});
    }

    async decrementJobApplicationCount(jobId: string) {
        // Guard: only decrement if count > 0 to prevent going negative
        await this.prisma.job.updateMany({
            where: { id: jobId, applicationCount: { gt: 0 } },
            data: { applicationCount: { decrement: 1 } },
        }).catch(() => {/* non-critical */});
    }
}
