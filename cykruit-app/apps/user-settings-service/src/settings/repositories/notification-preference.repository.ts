// apps/user-settings-service/src/settings/repositories/notification-preference.repository.ts
//
// Single table (NotificationPreference) serves BOTH seeker and employer.
// Fields are role-aware — seeker updates only seeker fields, employer updates only employer fields.
// No mixing, no cross-role writes. Service layer enforces this.

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { NotificationPreference } from "@prisma/client";

export type NotificationPrefUpdateData = Partial<
  Omit<NotificationPreference, "id" | "userId" | "createdAt" | "updatedAt">
>;

// Seeker-allowed fields — only these can be written when role === SEEKER
export const SEEKER_NOTIFICATION_FIELDS: (keyof NotificationPreference)[] = [
  "enableInApp",
  "enableEmail",
  "applicationSubmitted_inApp",
  "applicationSubmitted_email",
  "applicationStatus_inApp",
  "applicationStatus_email",
  "jobRejection_inApp",
  "jobRejection_email",
  "interviewScheduled_inApp",
  "interviewScheduled_email",
  "jobAlert_inApp",
  "jobAlert_email",
  "jobAlert_frequency",
];

// Employer-allowed fields — only these can be written when role === EMPLOYER
export const EMPLOYER_NOTIFICATION_FIELDS: (keyof NotificationPreference)[] = [
  "enableInApp",
  "enableEmail",
  "newApplicant_inApp",
  "newApplicant_email",
  "applicationUpdate_inApp",
  "applicationUpdate_email",
  "groupedApplicants_inApp",
  "groupedApplicants_email",
  "groupedApplicants_frequency",
  "jobExpiryAlert_inApp",
  "jobExpiryAlert_email",
  "jobApproval_inApp",
  "jobApproval_email",
  "kycApproved_inApp",
  "kycApproved_email",
  "kycRejected_inApp",
  "kycRejected_email",
  "platformAnnouncement_inApp",
  "platformAnnouncement_email",
];

@Injectable()
export class NotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    return this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  async upsert(
    userId: string,
    data: NotificationPrefUpdateData,
  ): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: { ...data },
    });
  }

  async createWithDefaults(userId: string): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.create({
      data: { userId },
      // All defaults are defined in the Prisma schema — no need to repeat here
    });
  }
}
