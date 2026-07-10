// admin-app/src/admin/services/testimonials.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { TestimonialsRepository } from '../repositories/testimonials.repository';
import { AdminAuditLogger } from './admin-audit.logger';
import {
    AdminTestimonialsQueryDto,
    CreateTestimonialDto,
    UpdateTestimonialDto,
} from '../dto/testimonials.dto';

@Injectable()
export class TestimonialsService {
    constructor(
        private readonly repo: TestimonialsRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: AdminTestimonialsQueryDto) {
        return this.repo.findAll(query);
    }

    async getById(id: string) {
        const t = await this.repo.findById(id);
        if (!t) throw new NotFoundException('Testimonial not found');
        return t;
    }

    async create(adminId: string, dto: CreateTestimonialDto) {
        const created = await this.repo.create(dto);

        this.auditLogger.log({
            adminId,
            action: 'testimonials:create',
            module: 'testimonials',
            resource: 'Testimonial',
            resourceId: created.id,
            newData: dto as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return created;
    }

    async update(adminId: string, id: string, dto: UpdateTestimonialDto) {
        const existing = await this.getById(id);
        const updated = await this.repo.update(id, dto);

        this.auditLogger.log({
            adminId,
            action: 'testimonials:update',
            module: 'testimonials',
            resource: 'Testimonial',
            resourceId: id,
            oldData: existing,
            newData: dto as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async delete(adminId: string, id: string) {
        await this.getById(id);
        await this.repo.delete(id);

        this.auditLogger.log({
            adminId,
            action: 'testimonials:delete',
            module: 'testimonials',
            resource: 'Testimonial',
            resourceId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return { message: 'Testimonial deleted' };
    }

    async publish(adminId: string, id: string) {
        await this.getById(id);
        const updated = await this.repo.setPublished(id, true);

        this.auditLogger.log({
            adminId,
            action: 'testimonials:publish',
            module: 'testimonials',
            resource: 'Testimonial',
            resourceId: id,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async unpublish(adminId: string, id: string) {
        await this.getById(id);
        const updated = await this.repo.setPublished(id, false);

        this.auditLogger.log({
            adminId,
            action: 'testimonials:unpublish',
            module: 'testimonials',
            resource: 'Testimonial',
            resourceId: id,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }
}
