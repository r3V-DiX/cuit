// apps/user-settings-service/src/settings/mappers/notification.mapper.ts
//
// Shapes the flat NotificationPreference DB row into a nested,
// role-specific response that maps 1:1 to UI sections.
// Seeker response only returns seeker fields. Employer response only returns employer fields.

import { NotificationPreference } from "@prisma/client";

export function mapSeekerNotificationsToResponse(pref: NotificationPreference) {
  return {
    global: {
      enableInApp: pref.enableInApp,
      enableEmail: pref.enableEmail,
    },
    applications: {
      applicationSubmitted: {
        inApp: pref.applicationSubmitted_inApp,
        email: pref.applicationSubmitted_email,
      },
      applicationStatus: {
        inApp: pref.applicationStatus_inApp,
        email: pref.applicationStatus_email,
      },
      jobRejection: {
        inApp: pref.jobRejection_inApp,
        email: pref.jobRejection_email,
      },
    },
    interviews: {
      interviewScheduled: {
        inApp: pref.interviewScheduled_inApp,
        email: pref.interviewScheduled_email,
      },
    },
    jobAlerts: {
      jobAlert: {
        inApp: pref.jobAlert_inApp,
        email: pref.jobAlert_email,
        frequency: pref.jobAlert_frequency,
      },
    },
    updatedAt: pref.updatedAt,
  };
}

export function mapEmployerNotificationsToResponse(
  pref: NotificationPreference,
) {
  return {
    global: {
      enableInApp: pref.enableInApp,
      enableEmail: pref.enableEmail,
    },
    applicants: {
      newApplicant: {
        inApp: pref.newApplicant_inApp,
        email: pref.newApplicant_email,
      },
      applicationUpdate: {
        inApp: pref.applicationUpdate_inApp,
        email: pref.applicationUpdate_email,
      },
      groupedApplicants: {
        inApp: pref.groupedApplicants_inApp,
        email: pref.groupedApplicants_email,
        frequency: pref.groupedApplicants_frequency,
      },
    },
    jobManagement: {
      jobExpiryAlert: {
        inApp: pref.jobExpiryAlert_inApp,
        email: pref.jobExpiryAlert_email,
      },
      jobApproval: {
        inApp: pref.jobApproval_inApp,
        email: pref.jobApproval_email,
      },
    },
    kyc: {
      kycApproved: {
        inApp: pref.kycApproved_inApp,
        email: pref.kycApproved_email,
      },
      kycRejected: {
        inApp: pref.kycRejected_inApp,
        email: pref.kycRejected_email,
      },
    },
    platform: {
      platformAnnouncement: {
        inApp: pref.platformAnnouncement_inApp,
        email: pref.platformAnnouncement_email,
      },
    },
    updatedAt: pref.updatedAt,
  };
}

// ── Flat DTO → Prisma update shape ────────────────────────────────────────────
// When a nested DTO (from update endpoints) comes in, flatten it back to DB column names
// This is the inverse of the mapper above — used in notification service upsert calls

export type FlatNotificationFields = Partial<
  Omit<NotificationPreference, "id" | "userId" | "createdAt" | "updatedAt">
>;

export function flattenSeekerNotificationDto(
  dto: Record<string, any>,
): FlatNotificationFields {
  // DTO fields are already flat (e.g. enableInApp, applicationSubmitted_inApp, etc.)
  // No transformation needed — just pass through as-is
  return dto as FlatNotificationFields;
}

export function flattenEmployerNotificationDto(
  dto: Record<string, any>,
): FlatNotificationFields {
  return dto as FlatNotificationFields;
}
