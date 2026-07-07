// apps/seeker-service/src/seeker/services/jobs.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { JobsRepository } from '../repositories/jobs.repository';
import { JobSearchDto } from '../dto/job-search.dto';

@Injectable()
export class JobsService {
    constructor(private readonly jobsRepository: JobsRepository) {}

    async search(query: JobSearchDto, seekerId?: string) {
        const { items, total } = await this.jobsRepository.search(query, seekerId);

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

    async getBySlug(slug: string, seekerId?: string) {
        const job = await this.jobsRepository.findBySlug(slug, seekerId);
        if (!job) throw new NotFoundException('JOB_NOT_FOUND');

        // Increment view count (fire-and-forget)
        this.jobsRepository.incrementViewCount(job.id);

        return job;
    }
}
