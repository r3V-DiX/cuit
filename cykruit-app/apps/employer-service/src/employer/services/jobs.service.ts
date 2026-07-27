// apps/employer-service/src/employer/services/jobs.service.ts

import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';
import { JobStatus, ApplicationType } from '@prisma/client';
import { JobErrorCodes } from '@cykruit/common';
import { AuditService } from '@cykruit/audit';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { AI_QUEUES, AI_JOB_NAMES } from '@cykruit/ai';
import { EmployerLimitsService } from '@cykruit/subscription';
import { MailService } from '@cykruit/mail';
import { JobsRepository } from '../repositories/jobs.repository';
import { CompanyRepository } from '../repositories/company.repository';
import { CreateJobDto, UpdateJobDto, CloseJobDto, JobListQueryDto } from '../dto/job.dto';

@Injectable()
export class JobsService {
    private readonly logger = new Logger(JobsService.name);

    constructor(
        private readonly jobsRepository: JobsRepository,
        private readonly companyRepository: CompanyRepository,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly auditService: AuditService,
        private readonly employerLimitsService: EmployerLimitsService,
        private readonly mailService: MailService,
        @InjectQueue(AI_QUEUES.AI_JOBS) private aiQueue: Queue,
    ) {}

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Resolve employer record — no verification check. Throws 404 if no company. */
    private async resolveEmployer(userId: string) {
        const employer = await this.companyRepository.findByMemberId(userId);
        if (!employer) {
            throw new NotFoundException(JobErrorCodes.COMPANY_NOT_VERIFIED);
        }
        return employer;
    }

    /** Resolve employer and assert it is verified. Throws 403 if not verified. */
    private async resolveVerifiedEmployer(userId: string) {
        const employer = await this.resolveEmployer(userId);
        if (!employer.isVerified) {
            throw new ForbiddenException(JobErrorCodes.COMPANY_NOT_VERIFIED);
        }
        return employer;
    }

    /**
     * Resolve employer, then fetch and assert the job belongs to it.
     */
    private async resolveJobForEmployer(userId: string, jobId: string) {
        const employer = await this.resolveVerifiedEmployer(userId);
        const job = await this.jobsRepository.findByIdAndEmployer(jobId, employer.id);
        if (!job) {
            throw new NotFoundException(JobErrorCodes.JOB_NOT_FOUND);
        }
        return { employer, job };
    }

    private async assertWithinActiveJobLimit(employerId: string): Promise<void> {
        const [activeCount, limits] = await Promise.all([
            this.jobsRepository.countActive(employerId),
            this.employerLimitsService.resolveForEmployer(employerId),
        ]);
        if (activeCount >= limits.maxActiveJobs) {
            throw new BadRequestException(JobErrorCodes.JOB_LIMIT_REACHED);
        }
    }

    private async assertWithinFeaturedSlotLimit(employerId: string): Promise<void> {
        const [usedSlots, limits] = await Promise.all([
            this.prisma.job.count({
                where: { employerId, isFeatured: true, status: { notIn: ['CLOSED', 'EXPIRED'] } },
            }),
            this.employerLimitsService.resolveForEmployer(employerId),
        ]);
        if (limits.featuredJobSlots === 0) {
            throw new ForbiddenException('Featured job slots require a paid subscription plan');
        }
        if (usedSlots >= limits.featuredJobSlots) {
            throw new BadRequestException(`Featured job slot limit reached (${limits.featuredJobSlots} slots on your plan)`);
        }
    }

    private notifyAdminsOfJobReview(
        jobTitle: string,
        companyName: string,
        jobType: string,
        workMode: string,
        jobId: string,
        isResubmission: boolean,
    ): void {
        const adminUrl = this.configService.get<string>('ADMIN_URL') ?? 'http://localhost:3001';
        const reviewUrl = `${adminUrl}/jobs/${jobId}`;

        this.prisma.admin.findMany({
            where: { isActive: true },
            select: { email: true, firstName: true },
        }).then((admins) => {
            for (const admin of admins) {
                this.mailService.sendJobReviewNotification(admin.email, {
                    adminFirstName: admin.firstName,
                    jobTitle,
                    companyName,
                    jobType,
                    workMode,
                    isResubmission,
                    reviewUrl,
                }).catch((err: unknown) => this.logger.warn(`Failed to send job review email to ${admin.email}: ${String(err)}`));
            }
        }).catch((err: unknown) => this.logger.warn(`Failed to fetch admins for job review notification jobId=${jobId}: ${String(err)}`));
    }

    /**
     * Generate a unique slug:  <jobTitle-kebab>-<employer-slug>-<4-char-suffix>
     * Retries up to 5 times on collision.
     */
    private async generateUniqueSlug(jobTitle: string, employerSlug: string): Promise<string> {
        const base = jobTitle
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

        for (let attempt = 0; attempt < 5; attempt++) {
            const suffix = Math.random().toString(36).substring(2, 6);
            const candidate = `${base}-${employerSlug}-${suffix}`;
            const existing = await this.jobsRepository.findBySlug(candidate);
            if (!existing) return candidate;
        }

        // Extremely unlikely to reach here — use timestamp as final fallback
        return `${base}-${employerSlug}-${Date.now().toString(36)}`;
    }

    private async resolveLocation(locationDto?: { city: string; state?: string; country: string }): Promise<string | undefined> {
        if (!locationDto) return undefined;
        const existing = await this.prisma.location.findFirst({
            where: {
                city: locationDto.city,
                country: locationDto.country,
                ...(locationDto.state ? { state: locationDto.state } : {}),
            },
        });
        if (existing) return existing.id;

        const displayName = [locationDto.city, locationDto.state, locationDto.country]
            .filter(Boolean)
            .join(', ');
        const newLocation = await this.prisma.location.create({
            data: {
                city: locationDto.city,
                state: locationDto.state,
                country: locationDto.country,
                displayName,
                searchText: displayName.toLowerCase(),
            },
        });
        return newLocation.id;
    }

    // ── Public methods ────────────────────────────────────────────────────────

    async list(userId: string, query: JobListQueryDto) {
        const employer = await this.resolveEmployer(userId);
        const { items, total } = await this.jobsRepository.findByEmployer(employer.id, query);

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

    /** Real aggregate counts by status — not a client-side tally of a capped page. */
    async getStatusCounts(userId: string) {
        const employer = await this.resolveEmployer(userId);
        const grouped = await this.prisma.job.groupBy({
            by: ['status'],
            where: { employerId: employer.id },
            _count: true,
        });
        const counts = { active: 0, pending: 0, draft: 0, closed: 0 };
        for (const g of grouped) {
            if (g.status === JobStatus.APPROVED) counts.active = g._count;
            else if (g.status === JobStatus.PENDING) counts.pending = g._count;
            else if (g.status === JobStatus.DRAFT) counts.draft = g._count;
            else if (g.status === JobStatus.CLOSED) counts.closed = g._count;
        }
        return counts;
    }

    async getOne(userId: string, jobId: string) {
        const employer = await this.resolveEmployer(userId);
        const job = await this.jobsRepository.findByIdAndEmployer(jobId, employer.id);
        if (!job) {
            throw new NotFoundException(JobErrorCodes.JOB_NOT_FOUND);
        }
        return job;
    }

    async create(userId: string, dto: CreateJobDto, ipAddress?: string, userAgent?: string) {
        const employer = await this.resolveVerifiedEmployer(userId);

        // External URL is mandatory for EXTERNAL application type
        if (
            dto.applicationType === ApplicationType.EXTERNAL &&
            !dto.externalUrl
        ) {
            throw new BadRequestException('externalUrl is required when applicationType is EXTERNAL');
        }

        // Subscription limit only counts APPROVED + PENDING;
        // a new DRAFT does not consume a slot — skip the check here.
        // (The limit is enforced on submit/reopen instead.)

        // Featured slot check on creation (featured drafts pre-reserve a slot)
        if (dto.isFeatured) {
            await this.assertWithinFeaturedSlotLimit(employer.id);
        }

        const slug = await this.generateUniqueSlug(dto.jobTitle, employer.slug);
        const resolvedLocationId = await this.resolveLocation(dto.location) || dto.locationId;

        const job = await this.prisma.$transaction(async (tx) => {
            const created = await this.jobsRepository.create({
                employer: { connect: { id: employer.id } },
                slug,
                jobTitle: dto.jobTitle,
                jobType: dto.jobType,
                workMode: dto.workMode,
                experienceLevel: dto.experienceLevel,
                applicationType: dto.applicationType,
                status: JobStatus.DRAFT,
                isFeatured: dto.isFeatured ?? false,
                ...(dto.roleId ? { role: { connect: { id: dto.roleId } } } : {}),
                ...(resolvedLocationId ? { location: { connect: { id: resolvedLocationId } } } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.externalUrl !== undefined ? { externalUrl: dto.externalUrl } : {}),
                ...(dto.screeningQuestions !== undefined
                    ? { screeningQuestions: dto.screeningQuestions as unknown as Prisma.InputJsonValue }
                    : {}),
                ...(dto.contractDuration !== undefined
                    ? { contractDuration: dto.contractDuration }
                    : {}),
                ...(dto.requirements !== undefined
                    ? { requirements: dto.requirements as unknown as Prisma.InputJsonValue }
                    : {}),
                ...(dto.responsibilities !== undefined
                    ? { responsibilities: dto.responsibilities as unknown as Prisma.InputJsonValue }
                    : {}),
                ...(dto.niceToHave !== undefined
                    ? { niceToHave: dto.niceToHave as unknown as Prisma.InputJsonValue }
                    : {}),
            });

            if (dto.skillNames && dto.skillNames.length > 0) {
                const skills = await tx.skill.findMany({
                    where: { name: { in: dto.skillNames } },
                    select: { id: true, name: true },
                });
                const skillData = skills.map((s) => ({ jobId: created.id, skillId: s.id }));
                if (skillData.length > 0) {
                    await tx.jobSkill.createMany({ data: skillData, skipDuplicates: true });
                }
            }

            return created;
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'jobs:create',
            module: 'JOBS',
            targetType: 'Job',
            targetId: job.id,
            newData: { jobTitle: job.jobTitle, status: job.status },
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return job;
    }

    async update(userId: string, jobId: string, dto: UpdateJobDto, ipAddress?: string, userAgent?: string) {
        const { employer, job } = await this.resolveJobForEmployer(userId, jobId);

        if (job.status === JobStatus.CLOSED || job.status === JobStatus.EXPIRED) {
            throw new BadRequestException(JobErrorCodes.JOB_NOT_EDITABLE);
        }

        // Check featured slot limit when upgrading a non-featured job to featured
        if (dto.isFeatured === true && !job.isFeatured) {
            await this.assertWithinFeaturedSlotLimit(employer.id);
        }

        const wasApproved = job.status === JobStatus.APPROVED;
        const wasPending  = job.status === JobStatus.PENDING;
        const wasRejected = job.status === JobStatus.REJECTED;

        const resolvedLocationId = await this.resolveLocation(dto.location) || dto.locationId;

        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.job.update({
                where: { id: jobId },
                data: {
                    ...(dto.jobTitle !== undefined ? { jobTitle: dto.jobTitle } : {}),
                    ...(dto.jobType !== undefined ? { jobType: dto.jobType } : {}),
                    ...(dto.workMode !== undefined ? { workMode: dto.workMode } : {}),
                    ...(dto.experienceLevel !== undefined
                        ? { experienceLevel: dto.experienceLevel }
                        : {}),
                    ...(dto.applicationType !== undefined
                        ? { applicationType: dto.applicationType }
                        : {}),
                    ...(dto.description !== undefined ? { description: dto.description } : {}),
                    ...(dto.externalUrl !== undefined ? { externalUrl: dto.externalUrl } : {}),
                    ...(dto.screeningQuestions !== undefined
                        ? { screeningQuestions: dto.screeningQuestions as unknown as Prisma.InputJsonValue }
                        : {}),
                    ...(dto.contractDuration !== undefined
                        ? { contractDuration: dto.contractDuration }
                        : {}),
                    ...(dto.requirements !== undefined
                        ? { requirements: dto.requirements as unknown as Prisma.InputJsonValue }
                        : {}),
                    ...(dto.responsibilities !== undefined
                        ? { responsibilities: dto.responsibilities as unknown as Prisma.InputJsonValue }
                        : {}),
                    ...(dto.niceToHave !== undefined
                        ? { niceToHave: dto.niceToHave as unknown as Prisma.InputJsonValue }
                        : {}),
                    ...(dto.roleId !== undefined
                        ? { role: dto.roleId ? { connect: { id: dto.roleId } } : { disconnect: true } }
                        : {}),
                    ...(resolvedLocationId !== undefined || dto.locationId !== undefined
                        ? {
                              location: resolvedLocationId
                                  ? { connect: { id: resolvedLocationId } }
                                  : { disconnect: true },
                          }
                        : {}),
                    ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
                    // Editing APPROVED or PENDING sends it back for re-review; clear stale rejection reason on REJECTED edits
                    ...((wasApproved || wasPending) ? { status: JobStatus.PENDING } : {}),
                    ...(wasRejected ? { rejectionReason: null } : {}),
                },
                include: {
                    skills: { include: { skill: true } },
                    certifications: { include: { certification: true } },
                    role: true,
                    location: true,
                },
            });

            // Sync skills when skillNames is provided (replace-all semantics)
            if (dto.skillNames !== undefined) {
                await tx.jobSkill.deleteMany({ where: { jobId } });
                if (dto.skillNames.length > 0) {
                    const skills = await tx.skill.findMany({
                        where: { name: { in: dto.skillNames } },
                        select: { id: true },
                    });
                    const skillData = skills.map((s) => ({ jobId, skillId: s.id }));
                    if (skillData.length > 0) {
                        await tx.jobSkill.createMany({ data: skillData, skipDuplicates: true });
                    }
                }
            }

            return result;
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'jobs:update',
            module: 'JOBS',
            targetType: 'Job',
            targetId: jobId,
            oldData: { jobTitle: job.jobTitle, status: job.status },
            newData: { jobTitle: updated.jobTitle, status: updated.status },
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        if (wasApproved || wasPending) {
            this.notifyAdminsOfJobReview(
                updated.jobTitle,
                employer.companyName,
                updated.jobType,
                updated.workMode,
                jobId,
                true,
            );
        }

        return updated;
    }

    async submit(userId: string, jobId: string, ipAddress?: string, userAgent?: string) {
        const { employer, job } = await this.resolveJobForEmployer(userId, jobId);

        if (job.status !== JobStatus.DRAFT && job.status !== JobStatus.REJECTED) {
            throw new BadRequestException(JobErrorCodes.INVALID_JOB_STATUS);
        }

        // Submitting moves the job to PENDING — it will count towards active limit once approved.
        // However, guard against already-pending + approved slots exceeding the cap.
        await this.assertWithinActiveJobLimit(employer.id);

        const submitted = await this.jobsRepository.updateStatus(jobId, JobStatus.PENDING, {
            // Clear previous rejection reason when resubmitting
            rejectionReason: null,
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'jobs:submit',
            module: 'JOBS',
            targetType: 'Job',
            targetId: jobId,
            oldData: { status: job.status },
            newData: { status: submitted.status },
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        this.notifyAdminsOfJobReview(
            submitted.jobTitle,
            employer.companyName,
            submitted.jobType,
            submitted.workMode,
            jobId,
            job.status === JobStatus.REJECTED,
        );

        return submitted;
    }

    async close(userId: string, jobId: string, dto: CloseJobDto, ipAddress?: string, userAgent?: string) {
        const { employer, job } = await this.resolveJobForEmployer(userId, jobId);

        if (job.status !== JobStatus.APPROVED && job.status !== JobStatus.PENDING) {
            throw new BadRequestException(JobErrorCodes.JOB_ALREADY_CLOSED);
        }

        const closed = await this.jobsRepository.close(jobId, dto.reason);

        // Decrement active job counter (fire-and-forget — counter staleness is non-fatal)
        this.prisma.employerSubscription.updateMany({
            where: { employerId: employer.id, currentActiveJobs: { gt: 0 } },
            data: { currentActiveJobs: { decrement: 1 } },
        }).catch((err: unknown) => this.logger.warn(`Failed to decrement active job counter for employer ${employer.id}: ${String(err)}`));

        // Decrement featured slot counter if this was a featured job
        if (job.isFeatured) {
            this.prisma.employerSubscription.updateMany({
                where: { employerId: employer.id, usedFeaturedJobSlots: { gt: 0 } },
                data: { usedFeaturedJobSlots: { decrement: 1 } },
            }).catch((err: unknown) => this.logger.warn(`Failed to decrement featured slot counter for employer ${employer.id}: ${String(err)}`));
        }

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'jobs:close',
            module: 'JOBS',
            targetType: 'Job',
            targetId: jobId,
            oldData: { status: job.status },
            reason: dto.reason,
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return closed;
    }

    async delete(userId: string, jobId: string, ipAddress?: string, userAgent?: string) {
        const { job } = await this.resolveJobForEmployer(userId, jobId);

        if (job.status !== JobStatus.DRAFT) {
            throw new BadRequestException(JobErrorCodes.JOB_NOT_DELETABLE);
        }

        await this.jobsRepository.delete(jobId);

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'jobs:delete',
            module: 'JOBS',
            targetType: 'Job',
            targetId: jobId,
            oldData: { jobTitle: job.jobTitle, status: job.status },
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return { message: 'Job deleted successfully' };
    }

    async reopen(userId: string, jobId: string, ipAddress?: string, userAgent?: string) {
        const { employer, job } = await this.resolveJobForEmployer(userId, jobId);

        if (job.status !== JobStatus.CLOSED) {
            throw new BadRequestException(JobErrorCodes.INVALID_JOB_STATUS);
        }

        // Reopening sends the job back through admin review → counts as a new active slot
        const limits = await this.employerLimitsService.resolveForEmployer(employer.id);
        const activeCount = await this.jobsRepository.countActive(employer.id);
        if (activeCount >= limits.maxActiveJobs) {
            throw new BadRequestException(JobErrorCodes.JOB_LIMIT_REACHED);
        }

        const publishedAt = new Date();
        const expiresAt = new Date(publishedAt);
        expiresAt.setDate(expiresAt.getDate() + limits.jobPostingPeriodDays);

        const reopened = await this.jobsRepository.updateStatus(jobId, JobStatus.PENDING, {
            closedReason: null,
            closedAt: null,
            publishedAt,
            expiresAt,
            rejectionReason: null,
        });

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'jobs:reopen',
            module: 'JOBS',
            targetType: 'Job',
            targetId: jobId,
            oldData: { status: job.status },
            newData: { status: reopened.status },
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return reopened;
    }

    async rankApplications(userId: string, jobId: string, ipAddress?: string, userAgent?: string) {
        const { employer, job } = await this.resolveJobForEmployer(userId, jobId);

        const limits = await this.employerLimitsService.resolveForEmployer(employer.id);
        if (!limits.aiScoringEnabled) {
            throw new ForbiddenException('AI Candidate Ranking is not available on your current plan.');
        }

        // Queue bulk rank job
        await this.aiQueue.add(
            AI_JOB_NAMES.BULK_RANK_JOB,
            { jobId }
        );

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'jobs:rank-applications',
            module: 'JOBS',
            targetType: 'Job',
            targetId: jobId,
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return { message: 'Bulk rank process started successfully' };
    }

    async improveDescription(userId: string, title: string, description: string, jobType?: string, experienceLevel?: string) {
        const employer = await this.resolveVerifiedEmployer(userId);
        const limits = await this.employerLimitsService.resolveForEmployer(employer.id);
        if (!limits.aiScoringEnabled) {
            throw new ForbiddenException('AI features require a paid subscription plan');
        }

        const aiUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:3005';
        const res = await fetch(`${aiUrl}/ai/jobs/improve-description`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, jobType, experienceLevel })
        });

        if (!res.ok) {
            throw new BadRequestException("Failed to improve description from AI service");
        }

        try {
            return await res.json();
        } catch {
            throw new BadRequestException("AI service returned an invalid response");
        }
    }

    async suggestSkills(userId: string, title: string, description: string) {
        const employer = await this.resolveVerifiedEmployer(userId);
        const limits = await this.employerLimitsService.resolveForEmployer(employer.id);
        if (!limits.aiScoringEnabled) {
            throw new ForbiddenException('AI features require a paid subscription plan');
        }

        const aiUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:3005';
        const res = await fetch(`${aiUrl}/ai/jobs/suggest-skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });

        if (!res.ok) {
            throw new BadRequestException("Failed to suggest skills from AI service");
        }

        try {
            return await res.json();
        } catch {
            throw new BadRequestException("AI service returned an invalid response");
        }
    }
}
