// apps/seeker-service/src/seeker/services/jobs.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { JobsRepository } from '../repositories/jobs.repository';
import { JobSearchDto } from '../dto/job-search.dto';
import { PrismaService } from '@cykruit/prisma';
import { AIService, AI_PROMPTS, AITaskTier } from '@cykruit/ai';
import { z } from 'zod';

@Injectable()
export class JobsService {
    constructor(
        private readonly jobsRepository: JobsRepository,
        private readonly prisma: PrismaService,
        private readonly aiService: AIService,
    ) {}

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

    async getMatchScore(slug: string, userId: string) {
        const job = await this.jobsRepository.findBySlug(slug);
        if (!job) throw new NotFoundException('JOB_NOT_FOUND');

        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { userId },
            include: {
                skills: { include: { skill: true } }
            }
        });

        if (!profile) throw new NotFoundException('PROFILE_NOT_FOUND');

        const seekerSkills = profile.skills.map(s => s.skill.name);
        const jobSkills = job.skills.map(s => s.skill.name);

        const prompt = AI_PROMPTS.MATCH_SCORE({
            seekerTitle: profile.title || 'Candidate',
            seekerSkills,
            jobTitle: job.jobTitle,
            jobDescription: job.description,
            requiredSkills: jobSkills,
        });

        const schema = z.object({
            score: z.number().min(0).max(100),
            reasons: z.array(z.string())
        });

        const result = await this.aiService.generateStructured(prompt, schema, { tier: AITaskTier.SMALL });
        return { data: result };
    }
}

