// admin-app/src/admin/services/settings.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { SettingsRepository } from './settings.repository';
import { AdminAuditLogger } from '../../common';
import { UpdateSettingDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
    constructor(
        private readonly repo: SettingsRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list() {
        return this.repo.findAll();
    }

    async update(adminId: string, key: string, dto: UpdateSettingDto) {
        const existing = await this.repo.findByKey(key);
        if (!existing) throw new NotFoundException(`Unknown setting key: ${key}`);

        const updated = await this.repo.updateValue(key, dto.value, adminId);

        this.auditLogger.log({
            adminId,
            action: 'settings:update',
            module: 'settings',
            resource: 'PlatformSetting',
            resourceId: updated.id,
            oldData: { key, value: existing.value } as unknown as Prisma.InputJsonValue,
            newData: { key, value: dto.value } as unknown as Prisma.InputJsonValue,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });

        return updated;
    }
}
