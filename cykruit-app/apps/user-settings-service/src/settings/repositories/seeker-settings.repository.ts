// apps/user-settings-service/src/settings/repositories/seeker-settings.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import {
    JobSeekerSettings,
    ProfileVisibility,
    JobSearchStatus,
    JobType,
    WorkMode,
} from '@prisma/client';

export interface UpsertSeekerSettingsData {
    profileVisibility?: ProfileVisibility;
    jobSearchStatus?: JobSearchStatus;
    availableFrom?: Date | null;
    preferredJobTypes?: JobType[];
    preferredWorkModes?: WorkMode[];
    willingToRelocate?: boolean;
}

@Injectable()
export class SeekerSettingsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByUserId(userId: string): Promise<JobSeekerSettings | null> {
        return this.prisma.jobSeekerSettings.findUnique({
            where: { userId },
        });
    }

    async upsert(userId: string, data: UpsertSeekerSettingsData): Promise<JobSeekerSettings> {
        return this.prisma.jobSeekerSettings.upsert({
            where: { userId },
            create: {
                userId,
                profileVisibility: data.profileVisibility ?? ProfileVisibility.PUBLIC,
                jobSearchStatus: data.jobSearchStatus ?? JobSearchStatus.ACTIVELY_LOOKING,
                availableFrom: data.availableFrom ?? null,
                preferredJobTypes: data.preferredJobTypes ?? [],
                preferredWorkModes: data.preferredWorkModes ?? [],
                willingToRelocate: data.willingToRelocate ?? false,
            },
            update: {
                ...data,
            },
        });
    }

    // Creates with all defaults — used when GET /settings finds no record
    async createWithDefaults(userId: string): Promise<JobSeekerSettings> {
        return this.prisma.jobSeekerSettings.create({
            data: {
                userId,
                profileVisibility: ProfileVisibility.PUBLIC,
                jobSearchStatus: JobSearchStatus.ACTIVELY_LOOKING,
                availableFrom: null,
                preferredJobTypes: [],
                preferredWorkModes: [],
                willingToRelocate: false,
            },
        });
    }
}