// apps/seeker-service/src/seeker/services/saved-jobs.service.ts

import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { JobStatus } from '@prisma/client';
import { SavedJobErrorCodes } from '@cykruit/common';
import { SavedJobsRepository } from '../repositories/saved-jobs.repository';
import { SaveJobDto, SavedJobListQueryDto } from '../dto/saved-job.dto';

@Injectable()
export class SavedJobsService {
    constructor(
        private readonly savedJobsRepository: SavedJobsRepository,
        private readonly prisma: PrismaService,
    ) {}

    async save(seekerId: string, jobId: string, dto: SaveJobDto) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            select: { id: true, status: true, employer: { select: { id: true } } },
        });

        if (!job || job.status !== JobStatus.APPROVED) {
            throw new NotFoundException('JOB_NOT_FOUND');
        }

        // Prevent saving own company job
        const isMember = await this.prisma.employerMember.findFirst({
            where: { userId: seekerId, employerId: job.employer.id },
        });
        if (isMember) {
            throw new ConflictException(SavedJobErrorCodes.CANNOT_SAVE_OWN_JOB);
        }

        const existing = await this.savedJobsRepository.findBySeekerAndJob(seekerId, jobId);
        if (existing) throw new ConflictException(SavedJobErrorCodes.JOB_ALREADY_SAVED);

        return this.savedJobsRepository.save(seekerId, jobId, dto.note);
    }

    async unsave(seekerId: string, jobId: string) {
        const existing = await this.savedJobsRepository.findBySeekerAndJob(seekerId, jobId);
        if (!existing) throw new NotFoundException(SavedJobErrorCodes.SAVED_JOB_NOT_FOUND);

        await this.savedJobsRepository.remove(seekerId, jobId);
        return { message: 'Job removed from saved list' };
    }

    async list(seekerId: string, query: SavedJobListQueryDto) {
        const { items, total } = await this.savedJobsRepository.findBySeeker(seekerId, query);

        const page = query.page ?? 1;
        const limit = query.limit ?? 10;

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
