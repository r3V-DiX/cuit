// apps/user-settings-service/src/settings/services/employer-settings.service.ts

import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { EmployerSettingsRepository } from '../repositories/employer-settings.repository';
import { NotificationPreferenceService } from './notification-preference.service';
import { UpdateEmployerGeneralDto } from '../dto/employer/update-employer-general.dto';

@Injectable()
export class EmployerSettingsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly employerSettingsRepo: EmployerSettingsRepository,
        private readonly notificationPrefService: NotificationPreferenceService,
    ) { }

    // ── GET /settings ─────────────────────────────────────────────
    async getFullSettings(userId: string) {
        const employer = await this.getEmployerOrThrow(userId);

        const [generalSettings, notifications] = await Promise.all([
            this.getOrCreateGeneralSettings(employer.id),
            this.notificationPrefService.getEmployerNotifications(userId),
        ]);

        return {
            general: generalSettings,
            notifications,
        };
    }

    // ── PATCH /settings/general ───────────────────────────────────
    async updateGeneralSettings(userId: string, dto: UpdateEmployerGeneralDto) {
        const employer = await this.getEmployerOrThrow(userId);

        const data: Parameters<typeof this.employerSettingsRepo.upsertByEmployerId>[1] = {};

        if (dto.profileVisibility !== undefined) data.profileVisibility = dto.profileVisibility;
        if (dto.showCompanyDetailsBeforeApply !== undefined) {
            data.showCompanyDetailsBeforeApply = dto.showCompanyDetailsBeforeApply;
        }

        const updated = await this.employerSettingsRepo.upsertByEmployerId(employer.id, data);

        return {
            profileVisibility: updated.profileVisibility,
            showCompanyDetailsBeforeApply: updated.showCompanyDetailsBeforeApply,
            updatedAt: updated.updatedAt,
        };
    }

    // ── Private helpers ───────────────────────────────────────────

    private async getEmployerOrThrow(userId: string) {
        const employer = await this.prisma.employer.findUnique({
            where: { userId },
            select: { id: true, userId: true },
        });
        if (!employer) {
            throw new NotFoundException({
                code: 'EMPLOYER_NOT_FOUND',
                message: 'Employer profile not found.',
            });
        }
        return employer;
    }

    private async getOrCreateGeneralSettings(employerId: string) {
        let settings = await this.employerSettingsRepo.findByEmployerId(employerId);
        if (!settings) {
            settings = await this.employerSettingsRepo.createWithDefaults(employerId);
        }
        return {
            profileVisibility: settings.profileVisibility,
            showCompanyDetailsBeforeApply: settings.showCompanyDetailsBeforeApply,
            updatedAt: settings.updatedAt,
        };
    }
}