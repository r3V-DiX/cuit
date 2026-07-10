// apps/employer-service/src/employer/services/jobs.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { JobStatus, ApplicationType } from '@prisma/client';
import { JobErrorCodes } from '@cykruit/common';
import { JobsRepository } from '../repositories/jobs.repository';
import { CompanyRepository } from '../repositories/company.repository';
import { CreateJobDto, UpdateJobDto, CloseJobDto, JobListQueryDto } from '../dto/job.dto';

/** Default limits when no active EmployerSubscription row exists. Matches Free plan seed (3). */
const DEFAULT_MAX_ACTIVE_JOBS = 3;

/** Days until a published job automatically expires. */
const JOB_EXPIRY_DAYS = 45;

@Injectable()
export class JobsService {
    constructor(
        private readonly jobsRepository: JobsRepository,
        private readonly companyRepository: CompanyRepository,
        private readonly prisma: PrismaService,
    ) {}

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Resolve the employer record for the acting user and assert it is verified.
     * Throws ForbiddenException if not verified, NotFoundException if no company.
     */
    private async resolveVerifiedEmployer(userId: string) {
        const employer = await this.companyRepository.findByMemberId(userId);
        if (!employer) {
            throw new NotFoundException(JobErrorCodes.COMPANY_NOT_VERIFIED);
        }
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

    /**
     * Retrieve the employer's subscription limit (maxActiveJobs).
     * Falls back to DEFAULT_MAX_ACTIVE_JOBS when no subscription record exists.
     */
    private async getMaxActiveJobs(employerId: string): Promise<number> {
        const subscription = await this.prisma.employerSubscription.findUnique({
            where: { employerId },
            include: { package: true },
        });
        const now = new Date();
        if (
            subscription &&
            subscription.status === 'ACTIVE' &&
            (!subscription.expiresAt || subscription.expiresAt > now)
        ) {
            return subscription.package?.maxActiveJobs ?? DEFAULT_MAX_ACTIVE_JOBS;
        }
        return DEFAULT_MAX_ACTIVE_JOBS;
    }

    /**
     * Assert the employer has capacity for one more active job.
     */
    private async assertWithinActiveJobLimit(employerId: string): Promise<void> {
        const [activeCount, maxActive] = await Promise.all([
            this.jobsRepository.countActive(employerId),
            this.getMaxActiveJobs(employerId),
        ]);
        if (activeCount >= maxActive) {
            throw new BadRequestException(JobErrorCodes.JOB_LIMIT_REACHED);
        }
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

    // ── Public methods ────────────────────────────────────────────────────────

    async list(userId: string, query: JobListQueryDto) {
        const employer = await this.resolveVerifiedEmployer(userId);
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

    async getOne(userId: string, jobId: string) {
        const { job } = await this.resolveJobForEmployer(userId, jobId);
        return job;
    }

    async create(userId: string, dto: CreateJobDto) {
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

        const slug = await this.generateUniqueSlug(dto.jobTitle, employer.slug);

        const job = await this.jobsRepository.create({
            employer: { connect: { id: employer.id } },
            slug,
            jobTitle: dto.jobTitle,
            jobType: dto.jobType,
            workMode: dto.workMode,
            experienceLevel: dto.experienceLevel,
            applicationType: dto.applicationType,
            status: JobStatus.DRAFT,
            ...(dto.roleId ? { role: { connect: { id: dto.roleId } } } : {}),
            ...(dto.locationId ? { location: { connect: { id: dto.locationId } } } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.externalUrl !== undefined ? { externalUrl: dto.externalUrl } : {}),
            ...(dto.screeningQuestions !== undefined
                ? { screeningQuestions: dto.screeningQuestions }
                : {}),
            ...(dto.contractDuration !== undefined
                ? { contractDuration: dto.contractDuration }
                : {}),
        });

        return job;
    }

    async update(userId: string, jobId: string, dto: UpdateJobDto) {
        const { job } = await this.resolveJobForEmployer(userId, jobId);

        if (job.status === JobStatus.CLOSED || job.status === JobStatus.EXPIRED) {
            throw new BadRequestException(JobErrorCodes.JOB_NOT_EDITABLE);
        }

        const updated = await this.jobsRepository.update(jobId, {
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
                ? { screeningQuestions: dto.screeningQuestions }
                : {}),
            ...(dto.contractDuration !== undefined
                ? { contractDuration: dto.contractDuration }
                : {}),
            // Relational updates
            ...(dto.roleId !== undefined
                ? { role: dto.roleId ? { connect: { id: dto.roleId } } : { disconnect: true } }
                : {}),
            ...(dto.locationId !== undefined
                ? {
                      location: dto.locationId
                          ? { connect: { id: dto.locationId } }
                          : { disconnect: true },
                  }
                : {}),
        });

        return updated;
    }

    async submit(userId: string, jobId: string) {
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

        return submitted;
    }

    async close(userId: string, jobId: string, dto: CloseJobDto) {
        const { job } = await this.resolveJobForEmployer(userId, jobId);

        if (job.status !== JobStatus.APPROVED && job.status !== JobStatus.PENDING) {
            throw new BadRequestException(JobErrorCodes.JOB_ALREADY_CLOSED);
        }

        return this.jobsRepository.close(jobId, dto.reason);
    }

    async delete(userId: string, jobId: string) {
        const { job } = await this.resolveJobForEmployer(userId, jobId);

        if (job.status !== JobStatus.DRAFT) {
            throw new BadRequestException(JobErrorCodes.JOB_NOT_DELETABLE);
        }

        await this.jobsRepository.delete(jobId);
        return { message: 'Job deleted successfully' };
    }

    async reopen(userId: string, jobId: string) {
        const { employer, job } = await this.resolveJobForEmployer(userId, jobId);

        if (job.status !== JobStatus.CLOSED) {
            throw new BadRequestException(JobErrorCodes.INVALID_JOB_STATUS);
        }

        // Reopening sends the job back through admin review → counts as a new active slot
        await this.assertWithinActiveJobLimit(employer.id);

        const publishedAt = new Date();
        const expiresAt = new Date(publishedAt);
        expiresAt.setDate(expiresAt.getDate() + JOB_EXPIRY_DAYS);

        const reopened = await this.jobsRepository.updateStatus(jobId, JobStatus.PENDING, {
            closedReason: null,
            closedAt: null,
            publishedAt,
            expiresAt,
            rejectionReason: null,
        });

        return reopened;
    }
}
