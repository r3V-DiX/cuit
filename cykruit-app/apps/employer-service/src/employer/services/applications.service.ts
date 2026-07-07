// apps/employer-service/src/employer/services/applications.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { EventPublisher, DomainEventType } from '@cykruit/events';
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
    ) {}

    private async resolveEmployer(userId: string) {
        const employer = await this.companyRepo.findByMemberId(userId);
        if (!employer) throw new NotFoundException('No company found for your account');
        return employer;
    }

    async listForJob(userId: string, jobId: string, query: ApplicationListQueryDto) {
        const employer = await this.resolveEmployer(userId);

        // Verify job belongs to employer
        const job = await this.jobsRepo.findByIdAndEmployer(jobId, employer.id);
        if (!job) throw new NotFoundException('Job not found');

        const { items, total } = await this.applicationsRepo.findByJob(jobId, employer.id, query);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        return {
            items,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getOne(userId: string, applicationId: string) {
        const employer = await this.resolveEmployer(userId);
        const application = await this.applicationsRepo.findByIdAndEmployer(applicationId, employer.id);
        if (!application) throw new NotFoundException('Application not found');
        return application;
    }

    async updateStatus(userId: string, applicationId: string, dto: UpdateApplicationStatusDto) {
        const employer = await this.resolveEmployer(userId);
        const application = await this.applicationsRepo.findByIdAndEmployer(applicationId, employer.id);
        if (!application) throw new NotFoundException('Application not found');

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

        return updated;
    }
}
