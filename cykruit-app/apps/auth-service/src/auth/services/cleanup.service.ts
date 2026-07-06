// apps/auth-service/src/auth/services/cleanup.service.ts
// FIXES APPLIED:
//   [2] Injected PrismaService directly — removed (this.authRepository as any).prisma hack
//       The cast to any bypasses TypeScript and breaks silently if the private field is renamed
// NEW:
//   cleanPendingDeletionAccounts() — runs at 2am daily
//   Hard-deletes + anonymizes accounts past their 30-day deletion grace period

import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AppLogger } from "@cykruit/logger";
import { PrismaService } from "@cykruit/prisma";
import { AuthRepository } from "../repositories/auth.repository";

@Injectable()
export class CleanupService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  // Runs every hour — soft-revokes sessions past their expiresAt
  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredSessions(): Promise<void> {
    try {
      const count = await this.authRepository.deleteExpiredSessions();
      if (count > 0) {
        this.logger.log(
          `[CLEANUP] Revoked ${count} expired session(s)`,
          "CleanupService",
        );
      }
    } catch (error) {
      this.logger.error(
        "[CLEANUP] Failed to clean expired sessions",
        error?.stack,
        "CleanupService",
      );
    }
  }

  // Runs every 6 hours — hard-deletes unused tokens past expiresAt
  @Cron(CronExpression.EVERY_6_HOURS)
  async cleanExpiredTokens(): Promise<void> {
    try {
      const count = await this.authRepository.deleteExpiredTokens();
      if (count > 0) {
        this.logger.log(
          `[CLEANUP] Deleted ${count} expired token(s)`,
          "CleanupService",
        );
      }
    } catch (error) {
      this.logger.error(
        "[CLEANUP] Failed to clean expired tokens",
        error?.stack,
        "CleanupService",
      );
    }
  }

  // Runs at 3am daily — hard-deletes sessions revoked more than 30 days ago
  @Cron("0 3 * * *")
  async cleanOldRevokedSessions(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await this.prisma.session.deleteMany({
        where: {
          isActive: false,
          revokedAt: { lt: thirtyDaysAgo },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `[CLEANUP] Purged ${result.count} old revoked session(s) (>30 days)`,
          "CleanupService",
        );
      }
    } catch (error) {
      this.logger.error(
        "[CLEANUP] Failed to purge old revoked sessions",
        error?.stack,
        "CleanupService",
      );
    }
  }

  // ✅ NEW: Runs at 2am daily — hard-deletes + anonymizes accounts past the 30-day grace period
  // Accounts in PENDING_DELETION status with deletionScheduledAt in the past are permanently removed.
  // We anonymize rather than hard-delete the User row to preserve referential integrity
  // (applications, audit logs, messages etc. still reference the user ID).
  @Cron("0 2 * * *")
  async cleanPendingDeletionAccounts(): Promise<void> {
    try {
      const now = new Date();

      // Find all accounts past their scheduled deletion date
      const usersToDelete = await this.prisma.user.findMany({
        where: {
          status: "PENDING_DELETION",
          deletionScheduledAt: { lt: now },
        },
        select: { id: true, email: true },
      });

      if (usersToDelete.length === 0) return;

      for (const user of usersToDelete) {
        await this.prisma.$transaction(async (tx) => {
          // Anonymize the user record — keep row for referential integrity
          await tx.user.update({
            where: { id: user.id },
            data: {
              status: "DELETED",
              email: `deleted_${user.id}@deleted.cykruit.com`,
              firstName: "Deleted",
              lastName: "User",
              phone: null,
              profileImage: null,
              // Clear password — account can never be logged into again
              password: "",
              deletionScheduledAt: null,
              deactivatedAt: null,
            },
          });

          // Purge all PII-bearing related records
          await tx.session.deleteMany({ where: { userId: user.id } });
          await tx.token.deleteMany({ where: { userId: user.id } });
          await tx.userOAuthProvider.deleteMany({ where: { userId: user.id } });

          // Anonymize job seeker profile if it exists
          await tx.jobSeekerProfile.updateMany({
            where: { userId: user.id },
            data: {
              firstName: "Deleted",
              lastName: "User",
            },
          });
        });

        this.logger.log(
          `[CLEANUP] Hard deleted account: ${user.id}`,
          "CleanupService",
        );
      }

      this.logger.log(
        `[CLEANUP] Hard deleted ${usersToDelete.length} account(s) past grace period`,
        "CleanupService",
      );
    } catch (error) {
      this.logger.error(
        "[CLEANUP] Failed to hard delete pending accounts",
        error?.stack,
        "CleanupService",
      );
    }
  }
}
