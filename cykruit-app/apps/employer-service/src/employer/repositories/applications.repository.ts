// apps/employer-service/src/employer/repositories/applications.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { ApplicationListQueryDto } from '../dto/application.dto';

const APPLICATION_INCLUDE = {
    job: {
        select: {
            id: true,
            jobTitle: true,
            slug: true,
            status: true,
            jobType: true,
            workMode: true,
            experienceLevel: true,
        },
    },
    jobSeeker: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
        },
    },
    resume: { select: { id: true, fileName: true, fileUrl: true } },
    statusHistory: { orderBy: { changedAt: 'desc' as const }, take: 10 },
} satisfies Prisma.ApplicationInclude;

@Injectable()
export class EmployerApplicationsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByJob(
        jobId: string,
        employerId: string,
        query: ApplicationListQueryDto,
    ): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 20, status } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ApplicationWhereInput = {
            jobId,
            job: { employerId },
            ...(status ? { status } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.application.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ aiScore: { sort: 'desc', nulls: 'last' } }, { appliedAt: 'desc' }],
                include: APPLICATION_INCLUDE,
            }),
            this.prisma.application.count({ where }),
        ]);

        return { items, total };
    }

    async findByEmployer(
        employerId: string,
        query: ApplicationListQueryDto,
    ): Promise<{ items: any[]; total: number }> {
        const { page = 1, limit = 20, status } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ApplicationWhereInput = {
            job: { employerId },
            ...(status ? { status } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.application.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ aiScore: { sort: 'desc', nulls: 'last' } }, { appliedAt: 'desc' }],
                include: APPLICATION_INCLUDE,
            }),
            this.prisma.application.count({ where }),
        ]);

        return { items, total };
    }

    async findAllForExport(jobId: string, employerId: string) {
        return this.prisma.application.findMany({
            where: { jobId, job: { employerId } },
            orderBy: [{ aiScore: { sort: 'desc', nulls: 'last' } }, { appliedAt: 'desc' }],
            select: {
                id: true,
                status: true,
                appliedAt: true,
                aiScore: true,
                coverLetter: true,
                jobSeeker: {
                    select: { id: true, firstName: true, lastName: true, profileImage: true },
                },
                job: { select: { id: true, jobTitle: true } },
                resume: { select: { id: true, fileName: true, fileUrl: true } },
            },
        });
    }

    async findByIdAndEmployer(id: string, employerId: string) {
        return this.prisma.application.findFirst({
            where: { id, job: { employerId } },
            include: APPLICATION_INCLUDE,
        });
    }

    async updateStatus(
        id: string,
        status: ApplicationStatus,
        changedBy: string,
        note?: string,
    ) {
        const current = await this.prisma.application.findUnique({
            where: { id },
            select: { status: true },
        });
        if (!current) return null;

        return this.prisma.application.update({
            where: { id },
            data: {
                status,
                statusHistory: {
                    create: {
                        oldStatus: current.status,
                        newStatus: status,
                        changedBy,
                        reason: note,
                    },
                },
            },
            include: APPLICATION_INCLUDE,
        });
    }
}
