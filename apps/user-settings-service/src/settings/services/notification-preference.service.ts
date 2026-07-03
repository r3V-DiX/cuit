// apps/user-settings-service/src/settings/services/notification-preference.service.ts
//
// Role-aware: seeker and employer share the same NotificationPreference table.
// Service enforces field-level isolation — seeker can't touch employer fields and vice versa.

import { Injectable } from '@nestjs/common';
import {
    NotificationPreferenceRepository,
    SEEKER_NOTIFICATION_FIELDS,
    EMPLOYER_NOTIFICATION_FIELDS,
    NotificationPrefUpdateData,
} from '../repositories/notification-preference.repository';
import { UpdateSeekerNotificationsDto } from '../dto/seeker/update-seeker-notifications.dto';
import { UpdateEmployerNotificationsDto } from '../dto/employer/update-employer-notifications.dto';
import { mapSeekerNotificationsToResponse, mapEmployerNotificationsToResponse } from '../mappers/notification.mapper';

@Injectable()
export class NotificationPreferenceService {
    constructor(
        private readonly notificationPrefRepo: NotificationPreferenceRepository,
    ) { }

    async getSeekerNotifications(userId: string) {
        let pref = await this.notificationPrefRepo.findByUserId(userId);
        if (!pref) {
            pref = await this.notificationPrefRepo.createWithDefaults(userId);
        }
        return mapSeekerNotificationsToResponse(pref);
    }

    async getEmployerNotifications(userId: string) {
        let pref = await this.notificationPrefRepo.findByUserId(userId);
        if (!pref) {
            pref = await this.notificationPrefRepo.createWithDefaults(userId);
        }
        return mapEmployerNotificationsToResponse(pref);
    }

    async updateSeekerNotifications(
        userId: string,
        dto: UpdateSeekerNotificationsDto,
    ) {
        // Strip any keys not in SEEKER_NOTIFICATION_FIELDS (defense-in-depth)
        const safeData = this.pickAllowedFields(dto, SEEKER_NOTIFICATION_FIELDS);
        const updated = await this.notificationPrefRepo.upsert(userId, safeData);
        return mapSeekerNotificationsToResponse(updated);
    }

    async updateEmployerNotifications(
        userId: string,
        dto: UpdateEmployerNotificationsDto,
    ) {
        // Strip any keys not in EMPLOYER_NOTIFICATION_FIELDS (defense-in-depth)
        const safeData = this.pickAllowedFields(dto, EMPLOYER_NOTIFICATION_FIELDS);
        const updated = await this.notificationPrefRepo.upsert(userId, safeData);
        return mapEmployerNotificationsToResponse(updated);
    }

    private pickAllowedFields(
        data: Record<string, any>,
        allowedFields: string[],
    ): NotificationPrefUpdateData {
        return Object.fromEntries(
            Object.entries(data).filter(([key]) => allowedFields.includes(key as any)),
        ) as NotificationPrefUpdateData;
    }
}
