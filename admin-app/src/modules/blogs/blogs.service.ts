// admin-app/src/modules/blogs/blogs.service.ts

import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { BlogsRepository } from './blogs.repository';
import { AdminAuditLogger } from '../../common';
import {
    AdminBlogsQueryDto,
    CreateBlogDto,
    UpdateBlogDto,
} from './dto/blogs.dto';

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}

@Injectable()
export class BlogsService {
    constructor(
        private readonly repo: BlogsRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: AdminBlogsQueryDto) {
        return this.repo.findAll(query);
    }

    async getById(id: string) {
        const blog = await this.repo.findById(id);
        if (!blog) throw new NotFoundException('Blog article not found');
        return blog;
    }

    private async resolveUniqueSlug(rawSlug: string, excludeId?: string): Promise<string> {
        let baseSlug = slugify(rawSlug);
        if (!baseSlug) {
            baseSlug = `article-${Date.now()}`;
        }

        let candidateSlug = baseSlug;
        let counter = 1;

        while (true) {
            const existing = await this.repo.findBySlug(candidateSlug);
            if (!existing || (excludeId && existing.id === excludeId)) {
                return candidateSlug;
            }
            candidateSlug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    async create(adminId: string, dto: CreateBlogDto) {
        const initialSlug = dto.slug ? dto.slug : dto.title;
        const resolvedSlug = await this.resolveUniqueSlug(initialSlug);

        const created = await this.repo.create({
            ...dto,
            slug: resolvedSlug,
        });

        this.auditLogger.log({
            adminId,
            action: 'blogs:create',
            module: 'blogs',
            resource: 'Blog',
            resourceId: created.id,
            newData: created as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return created;
    }

    async update(adminId: string, id: string, dto: UpdateBlogDto) {
        const existing = await this.getById(id);

        let resolvedSlug = dto.slug;
        if (dto.slug && dto.slug !== existing.slug) {
            resolvedSlug = await this.resolveUniqueSlug(dto.slug, id);
        } else if (dto.title && !dto.slug && !existing.slug) {
            resolvedSlug = await this.resolveUniqueSlug(dto.title, id);
        }

        const payload: UpdateBlogDto = {
            ...dto,
            ...(resolvedSlug ? { slug: resolvedSlug } : {}),
        };

        const updated = await this.repo.update(id, payload);

        this.auditLogger.log({
            adminId,
            action: 'blogs:update',
            module: 'blogs',
            resource: 'Blog',
            resourceId: id,
            oldData: existing as unknown as Prisma.InputJsonValue,
            newData: updated as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async delete(adminId: string, id: string) {
        const existing = await this.getById(id);
        const deleted = await this.repo.delete(id);

        this.auditLogger.log({
            adminId,
            action: 'blogs:delete',
            module: 'blogs',
            resource: 'Blog',
            resourceId: id,
            oldData: existing as unknown as Prisma.InputJsonValue,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return deleted;
    }

    async publish(adminId: string, id: string) {
        await this.getById(id);
        const updated = await this.repo.setPublished(id, true);

        this.auditLogger.log({
            adminId,
            action: 'blogs:publish',
            module: 'blogs',
            resource: 'Blog',
            resourceId: id,
            newData: { isPublished: true },
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
            action: 'blogs:unpublish',
            module: 'blogs',
            resource: 'Blog',
            resourceId: id,
            newData: { isPublished: false },
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }
}
