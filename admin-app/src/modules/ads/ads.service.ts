// admin-app/src/modules/ads/ads.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { UploadService, UPLOAD_CONFIGS } from '@cykruit/upload';
import { AdsRepository } from './ads.repository';
import { AdminAuditLogger } from '../../common';
import { AdminAdsQueryDto, CreateAdDto, UpdateAdDto } from './dto/ads.dto';

@Injectable()
export class AdsService {
    constructor(
        private readonly repo: AdsRepository,
        private readonly auditLogger: AdminAuditLogger,
        private readonly uploadService: UploadService,
    ) {}

    async uploadImage(file: Express.Multer.File) {
        const result = await this.uploadService.uploadFile(file, UPLOAD_CONFIGS.AD_CREATIVE);
        const previewUrl = await this.uploadService.convertToPresignedUrl(result.fileUrl);
        return { imageUrl: result.fileUrl, previewUrl: previewUrl ?? result.fileUrl };
    }

    async list(query: AdminAdsQueryDto) {
        const result = await this.repo.findAll(query);
        result.items = await Promise.all(
            result.items.map(async (ad) => ({
                ...ad,
                previewUrl: (await this.uploadService.convertToPresignedUrl(ad.imageUrl)) ?? ad.imageUrl,
            })),
        );
        return result;
    }

    async getById(id: string) {
        const ad = await this.repo.findById(id);
        if (!ad) throw new NotFoundException('Ad not found');
        const previewUrl = await this.uploadService.convertToPresignedUrl(ad.imageUrl);
        return { ...ad, previewUrl: previewUrl ?? ad.imageUrl };
    }

    async create(adminId: string, dto: CreateAdDto) {
        const created = await this.repo.create(dto);

        this.auditLogger.log({
            adminId,
            action: 'ads:create',
            module: 'ads',
            resource: 'Ad',
            resourceId: created.id,
            newData: created as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return created;
    }

    async update(adminId: string, id: string, dto: UpdateAdDto) {
        const existing = await this.getById(id);
        const updated = await this.repo.update(id, dto);

        this.auditLogger.log({
            adminId,
            action: 'ads:update',
            module: 'ads',
            resource: 'Ad',
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
            action: 'ads:delete',
            module: 'ads',
            resource: 'Ad',
            resourceId: id,
            oldData: existing as unknown as Prisma.InputJsonValue,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return deleted;
    }

    async activate(adminId: string, id: string) {
        await this.getById(id);
        const updated = await this.repo.setActive(id, true);

        this.auditLogger.log({
            adminId,
            action: 'ads:activate',
            module: 'ads',
            resource: 'Ad',
            resourceId: id,
            newData: { isActive: true },
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async deactivate(adminId: string, id: string) {
        await this.getById(id);
        const updated = await this.repo.setActive(id, false);

        this.auditLogger.log({
            adminId,
            action: 'ads:deactivate',
            module: 'ads',
            resource: 'Ad',
            resourceId: id,
            newData: { isActive: false },
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }
}
