// apps/user-settings-service/src/settings/services/seeker-settings.service.ts
//
// Owns:
//   GET  /settings           → full settings dump (general + notifications + locations)
//   PATCH /settings/general  → general prefs
//
// Notifications and locations are handled by their own services but
// GET /settings aggregates all three here.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { SeekerSettingsRepository } from '../repositories/seeker-settings.repository';
import { NotificationPreferenceService } from './notification-preference.service';
import { LocationPreferenceService } from './location-preference.service';
import { UpdateSeekerGeneralDto } from '../dto/seeker/update-seeker-general.dto';

@Injectable()
export class SeekerSettingsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly seekerSettingsRepo: SeekerSettingsRepository,
        private readonly notificationPrefService: NotificationPreferenceService,
        private readonly locationPrefService: LocationPreferenceService,
    ) { }

    // ── GET /settings ─────────────────────────────────────────────
    // Auto-creates missing records with defaults — never returns 404
    async getFullSettings(userId: string) {
        // Verify user exists and is SEEKER
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });
        if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found.' });

        // Auto-create if missing (parallel fetch)
        const [generalSettings, notifications, locations] = await Promise.all([
            this.getOrCreateGeneralSettings(userId),
            this.notificationPrefService.getSeekerNotifications(userId),
            this.locationPrefService.getAll(userId),
        ]);

        return {
            general: generalSettings,
            notifications,
            locations,
        };
    }

    // ── PATCH /settings/general ───────────────────────────────────
    async updateGeneralSettings(userId: string, dto: UpdateSeekerGeneralDto) {
        const data: Parameters<typeof this.seekerSettingsRepo.upsert>[1] = {};

        if (dto.profileVisibility !== undefined) data.profileVisibility = dto.profileVisibility;
        if (dto.jobSearchStatus !== undefined) data.jobSearchStatus = dto.jobSearchStatus;
        if (dto.willingToRelocate !== undefined) data.willingToRelocate = dto.willingToRelocate;
        if (dto.preferredJobTypes !== undefined) data.preferredJobTypes = dto.preferredJobTypes;
        if (dto.preferredWorkModes !== undefined) data.preferredWorkModes = dto.preferredWorkModes;

        // Handle availableFrom: null = clear, string = set
        if (dto.availableFrom !== undefined) {
            data.availableFrom = dto.availableFrom ? new Date(dto.availableFrom) : null;
        }

        const updated = await this.seekerSettingsRepo.upsert(userId, data);

        return {
            profileVisibility: updated.profileVisibility,
            jobSearchStatus: updated.jobSearchStatus,
            availableFrom: updated.availableFrom,
            preferredJobTypes: updated.preferredJobTypes,
            preferredWorkModes: updated.preferredWorkModes,
            willingToRelocate: updated.willingToRelocate,
            updatedAt: updated.updatedAt,
        };
    }

    // ── Private helpers ───────────────────────────────────────────

    private async getOrCreateGeneralSettings(userId: string) {
        let settings = await this.seekerSettingsRepo.findByUserId(userId);
        if (!settings) {
            settings = await this.seekerSettingsRepo.createWithDefaults(userId);
        }
        return {
            profileVisibility: settings.profileVisibility,
            jobSearchStatus: settings.jobSearchStatus,
            availableFrom: settings.availableFrom,
            preferredJobTypes: settings.preferredJobTypes,
            preferredWorkModes: settings.preferredWorkModes,
            willingToRelocate: settings.willingToRelocate,
            updatedAt: settings.updatedAt,
        };
    }
}