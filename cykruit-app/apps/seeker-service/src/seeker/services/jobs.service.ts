// apps/seeker-service/src/seeker/services/jobs.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { JobsRepository } from '../repositories/jobs.repository';
import { JobSearchDto } from '../dto/job-search.dto';
import { PrismaService } from '@cykruit/prisma';
import { AIService, AI_PROMPTS, AITaskTier } from '@cykruit/ai';
import { z } from 'zod';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JobsService {
    private readonly aiUrl: string;

    constructor(
        private readonly jobsRepository: JobsRepository,
        private readonly prisma: PrismaService,
        private readonly aiService: AIService,
        private readonly configService: ConfigService,
    ) {
        this.aiUrl = this.configService.get<string>('AI_SERVICE_URL') ?? 'http://localhost:3005';
    }

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
        try {
            this.jobsRepository.incrementViewCount(job.id);
        } catch (e) {
            // Ignore error
        }

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

        // Check cache first using profile.id
        const existingMatch = await this.prisma.seekerJobMatch.findUnique({
            where: { seekerId_jobId: { seekerId: profile.id, jobId: job.id } }
        });
        if (existingMatch) {
            return { data: { score: existingMatch.score, reasons: [] } };
        }

        try {
            const res = await fetch(`${this.aiUrl}/ai/match-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seekerId: profile.id, jobId: job.id })
            });

            if (res.ok) {
                const data = await res.json() as { score: number };
                return { data: { score: data.score, reasons: [] } };
            }
        } catch (error) {
            console.error("AI service fetch error:", error);
        }

        return { data: { score: 0, reasons: [] } };
    }
}

