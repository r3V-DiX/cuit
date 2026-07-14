// apps/seeker-service/src/seeker/services/applications.service.ts

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { AIService } from '@cykruit/ai';
import { ApplicationStatus, ApplicationType, JobStatus, type Prisma } from '@prisma/client';
import { ApplicationErrorCodes, UserErrorCodes } from '@cykruit/common';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { AuditService } from '@cykruit/audit';
import { ApplicationsRepository } from '../repositories/applications.repository';
import { ApplyJobDto, WithdrawApplicationDto, ApplicationListQueryDto } from '../dto/apply-job.dto';

/** Minimum profile completion % required to apply. */
const MIN_PROFILE_COMPLETION = 40;

/** Statuses from which a seeker cannot withdraw. */
const NON_WITHDRAWABLE_STATUSES: ApplicationStatus[] = [
    ApplicationStatus.WITHDRAWN,
    ApplicationStatus.REJECTED,
    ApplicationStatus.SHORTLISTED,
];

@Injectable()
export class ApplicationsService {
    constructor(
        private readonly applicationsRepository: ApplicationsRepository,
        private readonly prisma: PrismaService,
        private readonly aiService: AIService,
        private readonly eventPublisher: EventPublisher,
        private readonly auditService: AuditService,
    ) {}

    // ── Private helpers ───────────────────────────────────────────────────────

    private async resolveJobForApplication(jobId: string) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                employer: { select: { id: true } },
                skills: { include: { skill: true } },
                certifications: { include: { certification: true } },
            },
        });

        if (!job) throw new NotFoundException(ApplicationErrorCodes.APPLICATION_NOT_FOUND);
        if (job.status !== JobStatus.APPROVED) {
            throw new BadRequestException(ApplicationErrorCodes.JOB_NOT_ACCEPTING_APPLICATIONS);
        }
        if (job.expiresAt && new Date() > job.expiresAt) {
            throw new BadRequestException(ApplicationErrorCodes.JOB_EXPIRED);
        }
        if (job.applicationType === ApplicationType.EXTERNAL) {
            throw new BadRequestException('This job uses an external application link');
        }

        return job;
    }

    private async resolveSeekerProfile(seekerId: string) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
            where: { userId: seekerId },
            include: {
                user: { select: { email: true, profileImage: true } },
                experiences: true,
                education: true,
                skills: { include: { skill: true } },
                certifications: { include: { certification: true } },
                projects: true,
                resumes: { orderBy: { uploadedAt: 'desc' }, take: 1 },
            },
        });

        return profile;
    }

    private validateScreeningAnswers(
        jobScreeningQuestions: Prisma.JsonValue | null | undefined,
        answers: Array<{ questionId: string; answer: string }> | undefined,
    ) {
        if (!jobScreeningQuestions) return;

        const questions: Array<{ id: string; question: string; required: boolean }> =
            Array.isArray(jobScreeningQuestions) ? jobScreeningQuestions : [];

        const requiredQuestions = questions.filter((q) => q.required);
        if (!requiredQuestions.length) return;

        if (!answers || !answers.length) {
            throw new BadRequestException(ApplicationErrorCodes.SCREENING_ANSWERS_REQUIRED);
        }

        const answersMap = new Map(answers.map((a) => [a.questionId, a.answer]));

        for (const q of requiredQuestions) {
            const answer = answersMap.get(q.id);
            if (!answer || answer.trim().length < 10) {
                throw new BadRequestException(ApplicationErrorCodes.REQUIRED_QUESTION_MISSING);
            }
        }
    }

    private async triggerAiScoring(
        applicationId: string,
        job: {
            jobTitle: string;
            experienceLevel: string;
            screeningQuestions?: Prisma.JsonValue | null;
            skills?: Array<{ skill: { name: string } }>;
            certifications?: Array<{ certification: { name: string } }>;
        },
        profile: {
            firstName?: string | null;
            lastName?: string | null;
            experiences?: unknown[];
            education?: unknown[];
            skills?: Array<{ skill: { name: string } }>;
            certifications?: Array<{ certification: { name: string } }>;
        },
    ): Promise<void> {
        try {
            const jobSkills = job.skills?.map((s: any) => s.skill.name) ?? [];
            const seekerSkills = profile.skills?.map((s: any) => s.skill.name) ?? [];
            const jobCerts = job.certifications?.map((c: any) => c.certification.name) ?? [];
            const seekerCerts = profile.certifications?.map((c: any) => c.certification.name) ?? [];

            const prompt = `
You are an applicant tracking system. Score this job application from 0-100.

Job: ${job.jobTitle}
Required Skills: ${jobSkills.join(', ') || 'None specified'}
Required Certifications: ${jobCerts.join(', ') || 'None specified'}
Experience Level Required: ${job.experienceLevel}

Applicant Skills: ${seekerSkills.join(', ') || 'None'}
Applicant Certifications: ${seekerCerts.join(', ') || 'None'}
Applicant Experience: ${profile.experiences?.length ?? 0} positions
Applicant Education: ${profile.education?.length ?? 0} entries

Return ONLY a JSON object: {"score": <0-100>, "breakdown": {"skills": <0-40>, "experience": <0-30>, "education": <0-20>, "certifications": <0-10>}, "summary": "<1 sentence>"}
            `.trim();

            const result = await this.aiService.generate(prompt, { maxTokens: 300, temperature: 0.1 });

            // Parse JSON from AI response
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return;

            const scored = JSON.parse(jsonMatch[0]);
            const score = Math.min(100, Math.max(0, Math.round(scored.score ?? 0)));

            await this.applicationsRepository.updateAiScore(applicationId, score, scored);
        } catch {
            // AI scoring is non-critical — never fail the apply flow
        }
    }

    // ── Public methods ────────────────────────────────────────────────────────

    async apply(seekerId: string, jobId: string, dto: ApplyJobDto, ipAddress?: string, userAgent?: string) {
        const job = await this.resolveJobForApplication(jobId);

        // Prevent employer from applying to own company job
        const isEmployerMember = await this.prisma.employerMember.findFirst({
            where: { userId: seekerId, employerId: job.employer.id },
        });
        if (isEmployerMember) {
            throw new ForbiddenException(ApplicationErrorCodes.CANNOT_APPLY_OWN_JOB);
        }

        // Duplicate check
        const existing = await this.applicationsRepository.findBySeekerAndJob(seekerId, jobId);
        if (existing) throw new BadRequestException(ApplicationErrorCodes.ALREADY_APPLIED);

        // Profile must exist
        const profile = await this.resolveSeekerProfile(seekerId);
        if (!profile) {
            throw new BadRequestException(UserErrorCodes.PROFILE_NOT_FOUND);
        }

        if (profile.profileCompletion < MIN_PROFILE_COMPLETION) {
            throw new BadRequestException(ApplicationErrorCodes.PROFILE_COMPLETION_TOO_LOW);
        }

        // Resolve resume — use provided or fall back to latest
        let resolvedResumeId: string | undefined = dto.resumeId;
        if (resolvedResumeId) {
            // Verify resume belongs to this seeker
            const resume = await this.prisma.resume.findFirst({
                where: { id: resolvedResumeId, profile: { userId: seekerId } },
                select: { id: true },
            });
            if (!resume) {
                throw new BadRequestException('Resume not found or does not belong to you');
            }
        } else if (profile.resumes?.length) {
            resolvedResumeId = profile.resumes[0].id;
        }

        // Validate screening answers
        this.validateScreeningAnswers(job.screeningQuestions, dto.screeningAnswers);

        let application: Awaited<ReturnType<typeof this.applicationsRepository.create>>;
        try {
            application = await this.applicationsRepository.create({
                jobId,
                seekerId,
                resumeId: resolvedResumeId,
                screeningAnswers: dto.screeningAnswers ?? null,
            });
        } catch (err: any) {
            // P2002 = unique constraint violation — concurrent duplicate apply
            if (err?.code === 'P2002') {
                throw new BadRequestException(ApplicationErrorCodes.ALREADY_APPLIED);
            }
            throw err;
        }

        // Increment job application count (fire-and-forget)
        this.applicationsRepository.incrementJobApplicationCount(jobId);

        // Trigger AI scoring in background (fire-and-forget)
        if (dto.useAiScoring !== false) {
            this.triggerAiScoring(application.id, job, profile);
        }

        // Notify employer of new applicant (fire-and-forget via event bus)
        const ownerMember = await this.prisma.employerMember.findFirst({
            where: { employerId: job.employer.id, role: 'OWNER' },
            select: { userId: true },
        });
        if (ownerMember) {
            this.eventPublisher.publish(
                DomainEventType.APPLICATION_SUBMITTED,
                {
                    applicationId: application.id,
                    jobId,
                    jobTitle: job.jobTitle,
                    seekerId,
                    seekerName: `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'A candidate',
                    employerId: job.employer.id,
                    employerUserId: ownerMember.userId,
                },
                'seeker-service',
            );
        }

        this.auditService.logAction({
            actorId: seekerId,
            actorRole: 'SEEKER',
            action: 'applications:apply',
            module: 'APPLICATIONS',
            targetType: 'Application',
            targetId: application.id,
            newData: { jobId, status: application.status },
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return application;
    }

    async withdraw(seekerId: string, applicationId: string, dto: WithdrawApplicationDto, ipAddress?: string, userAgent?: string) {
        const application = await this.applicationsRepository.findByIdAndSeeker(
            applicationId,
            seekerId,
        );

        if (!application) throw new NotFoundException(ApplicationErrorCodes.APPLICATION_NOT_FOUND);

        if (NON_WITHDRAWABLE_STATUSES.includes(application.status)) {
            if (application.status === ApplicationStatus.WITHDRAWN) {
                throw new BadRequestException(ApplicationErrorCodes.ALREADY_WITHDRAWN);
            }
            throw new BadRequestException(ApplicationErrorCodes.CANNOT_WITHDRAW_REJECTED);
        }

        const updated = await this.applicationsRepository.updateStatus(
            applicationId,
            ApplicationStatus.WITHDRAWN,
            seekerId,
            dto.reason,
        );

        // Decrement job application count (fire-and-forget)
        this.applicationsRepository.decrementJobApplicationCount(application.jobId);

        // Notify employer of withdrawal (fire-and-forget)
        const job = await this.prisma.job.findUnique({
            where: { id: application.jobId },
            select: { jobTitle: true, employerId: true },
        });
        if (job) {
            this.eventPublisher.publish(
                DomainEventType.APPLICATION_WITHDRAWN,
                {
                    applicationId,
                    jobId: application.jobId,
                    jobTitle: job.jobTitle,
                    seekerId,
                    employerId: job.employerId,
                },
                'seeker-service',
            );
        }

        this.auditService.logAction({
            actorId: seekerId,
            actorRole: 'SEEKER',
            action: 'applications:withdraw',
            module: 'APPLICATIONS',
            targetType: 'Application',
            targetId: applicationId,
            oldData: { status: application.status },
            reason: dto.reason,
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return updated;
    }

    async list(seekerId: string, query: ApplicationListQueryDto) {
        const { items, total } = await this.applicationsRepository.findBySeeker(seekerId, query);

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

    async getOne(seekerId: string, applicationId: string) {
        const application = await this.applicationsRepository.findByIdAndSeeker(
            applicationId,
            seekerId,
        );
        if (!application) throw new NotFoundException(ApplicationErrorCodes.APPLICATION_NOT_FOUND);
        return application;
    }
}
