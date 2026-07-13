// admin-app/src/admin/repositories/settings.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma } from '@prisma/client';

const SETTING_SELECT = {
    id: true,
    key: true,
    value: true,
    description: true,
    updatedBy: true,
    updatedAt: true,
    createdAt: true,
} satisfies Prisma.PlatformSettingSelect;

@Injectable()
export class SettingsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.platformSetting.findMany({
            orderBy: { key: 'asc' },
            select: SETTING_SELECT,
        });
    }

    async findByKey(key: string) {
        return this.prisma.platformSetting.findUnique({ where: { key }, select: SETTING_SELECT });
    }

    async updateValue(key: string, value: string, adminId: string) {
        return this.prisma.platformSetting.update({
            where: { key },
            data: { value, updatedBy: adminId },
            select: SETTING_SELECT,
        });
    }
}
