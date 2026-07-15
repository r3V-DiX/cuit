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
            return { score: existingMatch.score, reasons: [] };
        }

        try {
            const res = await fetch(`${this.aiUrl}/ai/match-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seekerId: profile.id, jobId: job.id })
            });

            if (res.ok) {
                const data = await res.json() as { score: number };
                return { score: data.score, reasons: [] };
            }
        } catch (error) {
            console.error("AI service fetch error:", error);
        }

        return { score: 0, reasons: [] };
    }

    async getRecommendedJobs(userId: string, limit: number = 3) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { userId }
        });

        if (!profile) throw new NotFoundException('PROFILE_NOT_FOUND');

        let recommendedJobs: { jobId: string, score: number }[] = [];

        try {
            const res = await fetch(`${this.aiUrl}/ai/jobs/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seekerId: profile.id, limit })
            });

            if (res.ok) {
                const data = await res.json() as { data: { jobId: string, score: number }[] };
                // Handle the global ResponseInterceptor wrapping from AI service if it applies, 
                // but actually AI service doesn't have it. Let's handle both just in case.
                recommendedJobs = Array.isArray(data) ? data : (data.data || []);
            }
        } catch (error) {
            console.error("AI service fetch error during recommendations:", error);
        }

        if (recommendedJobs.length === 0) {
            return { items: [] };
        }

        const jobIds = recommendedJobs.map(r => r.jobId);
        const scoreMap = new Map(recommendedJobs.map(r => [r.jobId, r.score]));

        // We can use the same JOB_LIST_INCLUDE from the repository by querying prisma directly
        // to match the exact shape expected by the frontend.
        const jobs = await this.prisma.job.findMany({
            where: { id: { in: jobIds }, status: 'APPROVED' },
            include: {
                employer: {
                    select: { id: true, companyName: true, slug: true, companyLogo: true, industry: true, isVerified: true },
                },
                role: true,
                location: true,
                skills: { include: { skill: { select: { id: true, name: true } } } },
                _count: { select: { applications: true } },
            }
        });

        // Sort by the AI score order
        const sortedJobs = jobs.sort((a, b) => {
            return (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0);
        });

        // Attach the match score to each job
        const items = sortedJobs.map(job => ({
            ...job,
            matchScore: scoreMap.get(job.id) || 0
        }));

        return { items };
    }
}

