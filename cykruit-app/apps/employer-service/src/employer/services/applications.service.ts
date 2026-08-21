// apps/employer-service/src/employer/services/applications.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    StreamableFile,
} from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { AuditService } from '@cykruit/audit';
import { EmployerLimitsService } from '@cykruit/subscription';
import { UploadService } from '@cykruit/upload';
import { CompanyRepository } from '../repositories/company.repository';
import { JobsRepository } from '../repositories/jobs.repository';
import { EmployerApplicationsRepository } from '../repositories/applications.repository';
import { ApplicationListQueryDto, UpdateApplicationStatusDto } from '../dto/application.dto';

/** Statuses that an employer cannot set — terminal seeker-owned states. */
const EMPLOYER_FORBIDDEN_STATUSES = new Set<ApplicationStatus>([
    ApplicationStatus.WITHDRAWN,
    ApplicationStatus.APPLIED,
]);

/** Valid employer-driven transitions matching the schema enum. */
const VALID_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
    [ApplicationStatus.APPLIED]:      [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED],
    [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
    [ApplicationStatus.SHORTLISTED]:  [ApplicationStatus.REJECTED],
};

@Injectable()
export class EmployerApplicationsService {
    constructor(
        private readonly applicationsRepo: EmployerApplicationsRepository,
        private readonly jobsRepo: JobsRepository,
        private readonly companyRepo: CompanyRepository,
        private readonly eventPublisher: EventPublisher,
        private readonly auditService: AuditService,
        private readonly employerLimitsService: EmployerLimitsService,
        private readonly uploadService: UploadService,
    ) {}

    private async resolveEmployer(userId: string) {
        const employer = await this.companyRepo.findByMemberId(userId);
        if (!employer) throw new NotFoundException('No company found for your account');
        return employer;
    }

    private async redactResume<T extends { resume?: { id: string; fileName: string; fileUrl: string } | null }>(
        item: T,
        resumeViewEnabled: boolean,
    ): Promise<T> {
        if (resumeViewEnabled || !item.resume) return item;
        return {
            ...item,
            resume: { id: item.resume.id, fileName: item.resume.fileName, fileUrl: null },
        };
    }

    private redactAiFields<T extends { aiScore?: unknown; aiScoreData?: unknown; aiScoredAt?: unknown }>(
        item: T,
        aiScoringEnabled: boolean,
    ): T {
        if (aiScoringEnabled) return item;
        return { ...item, aiScore: null, aiScoreData: null, aiScoredAt: null };
    }

    async listForJob(userId: string, jobId: string, query: ApplicationListQueryDto) {
        const employer = await this.resolveEmployer(userId);

        // Verify job belongs to employer
        const job = await this.jobsRepo.findByIdAndEmployer(jobId, employer.id);
        if (!job) throw new NotFoundException('Job not found');

        const [{ items, total }, limits] = await Promise.all([
            this.applicationsRepo.findByJob(jobId, employer.id, query),
            this.employerLimitsService.resolveForEmployer(employer.id),
        ]);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const redacted = await Promise.all(
            items.map(async (a) => {
                const r = await this.redactResume(a, limits.resumeViewEnabled);
                return this.redactAiFields(r, limits.aiScoringEnabled);
            }),
        );

        return {
            items: redacted,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async listForEmployer(userId: string, query: ApplicationListQueryDto) {
        const employer = await this.resolveEmployer(userId);

        const [{ items, total }, limits] = await Promise.all([
            this.applicationsRepo.findByEmployer(employer.id, query),
            this.employerLimitsService.resolveForEmployer(employer.id),
        ]);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const redacted = await Promise.all(
            items.map(async (a) => {
                const r = await this.redactResume(a, limits.resumeViewEnabled);
                return this.redactAiFields(r, limits.aiScoringEnabled);
            }),
        );

        return {
            items: redacted,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getOne(userId: string, applicationId: string, jobId?: string) {
        const employer = await this.resolveEmployer(userId);
        const application = await this.applicationsRepo.findByIdAndEmployer(applicationId, employer.id);
        if (!application) throw new NotFoundException('Application not found');
        if (jobId && application.jobId !== jobId) throw new NotFoundException('Application not found');

        const limits = await this.employerLimitsService.resolveForEmployer(employer.id);
        const redacted = await this.redactResume(application, limits.resumeViewEnabled);
        return this.redactAiFields(redacted, limits.aiScoringEnabled);
    }

    // Streams the resume file through this endpoint instead of exposing the
    // stored fileUrl directly to the browser — resume.fileUrl was previously
    // never presigned at all here (RESUMES is a private bucket, so opening it
    // raw would 403 in prod), and even presigned it would put a bearer-style
    // S3 URL in the browser's address bar. Same pattern as admin-app's
    // resumes.service.ts.
    async getResumeStream(userId: string, applicationId: string): Promise<StreamableFile> {
        const employer = await this.resolveEmployer(userId);

        const limits = await this.employerLimitsService.resolveForEmployer(employer.id);
        if (!limits.resumeViewEnabled) {
            throw new ForbiddenException('Resume viewing is not available on your current plan.');
        }

        const application = await this.applicationsRepo.findByIdAndEmployer(applicationId, employer.id);
        if (!application?.resume) throw new NotFoundException('Resume not found');

        const { stream, contentType, contentLength } = await this.uploadService.getFileStream(application.resume.fileUrl);
        return new StreamableFile(stream, {
            type: contentType ?? 'application/octet-stream',
            disposition: `inline; filename="${application.resume.fileName ?? 'resume.pdf'}"`,
            length: contentLength,
        });
    }

    async exportForJob(userId: string, jobId: string) {
        const employer = await this.resolveEmployer(userId);

        const limits = await this.employerLimitsService.resolveForEmployer(employer.id);
        if (!limits.canExportApplicants) {
            throw new ForbiddenException('Exporting applicants is not available on your current plan.');
        }

        const job = await this.jobsRepo.findByIdAndEmployer(jobId, employer.id);
        if (!job) throw new NotFoundException('Job not found');

        const rows = await this.applicationsRepo.findAllForExport(jobId, employer.id);
        return limits.aiScoringEnabled
            ? rows
            : rows.map((r) => ({ ...r, aiScore: null }));
    }

    async updateStatus(
        userId: string,
        applicationId: string,
        dto: UpdateApplicationStatusDto,
        jobId?: string,
        ipAddress?: string,
        userAgent?: string,
    ) {
        const employer = await this.resolveEmployer(userId);
        const application = await this.applicationsRepo.findByIdAndEmployer(applicationId, employer.id);
        if (!application) throw new NotFoundException('Application not found');
        if (jobId && application.jobId !== jobId) throw new NotFoundException('Application not found');

        if (EMPLOYER_FORBIDDEN_STATUSES.has(dto.status)) {
            throw new BadRequestException(`Cannot set status to ${dto.status}`);
        }

        const allowed = VALID_TRANSITIONS[application.status];
        if (!allowed || !allowed.includes(dto.status)) {
            throw new BadRequestException(
                `Cannot transition from ${application.status} to ${dto.status}`,
            );
        }

        const updated = await this.applicationsRepo.updateStatus(
            applicationId,
            dto.status,
            userId,
            dto.note,
        );

        // Notify seeker of status change
        this.eventPublisher.publish(
            DomainEventType.APPLICATION_STATUS_CHANGED,
            {
                applicationId,
                jobId: application.jobId,
                jobTitle: application.job.jobTitle,
                seekerId: application.seekerId,
                oldStatus: application.status,
                newStatus: dto.status,
                employerNote: dto.note,
            },
            'employer-service',
        );

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'applications:update_status',
            module: 'APPLICATIONS',
            targetType: 'Application',
            targetId: applicationId,
            oldData: { status: application.status },
            newData: { status: dto.status },
            reason: dto.note,
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return updated;
    }
}
