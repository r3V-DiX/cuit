// apps/user-settings-service/src/settings/repositories/employer-settings.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { EmployerSettings, EmployerProfileVisibility } from '@prisma/client';

export interface UpsertEmployerSettingsData {
    profileVisibility?: EmployerProfileVisibility;
    showCompanyDetailsBeforeApply?: boolean;
}

@Injectable()
export class EmployerSettingsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByEmployerId(employerId: string): Promise<EmployerSettings | null> {
        return this.prisma.employerSettings.findUnique({
            where: { employerId },
        });
    }

    async findByUserId(userId: string): Promise<EmployerSettings | null> {
        return this.prisma.employerSettings.findFirst({
            where: { employer: { members: { some: { userId } } } },
        });
    }

    async upsertByEmployerId(
        employerId: string,
        data: UpsertEmployerSettingsData,
    ): Promise<EmployerSettings> {
        return this.prisma.employerSettings.upsert({
            where: { employerId },
            create: {
                employerId,
                profileVisibility: data.profileVisibility ?? EmployerProfileVisibility.PUBLIC,
                showCompanyDetailsBeforeApply: data.showCompanyDetailsBeforeApply ?? true,
            },
            update: { ...data },
        });
    }

    async createWithDefaults(employerId: string): Promise<EmployerSettings> {
        return this.prisma.employerSettings.create({
            data: {
                employerId,
                profileVisibility: EmployerProfileVisibility.PUBLIC,
                showCompanyDetailsBeforeApply: true,
            },
        });
    }
}