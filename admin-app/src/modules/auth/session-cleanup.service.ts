// admin-app/src/modules/auth/session-cleanup.service.ts
// Mirrors cykruit-app's apps/auth-service/src/auth/services/cleanup.service.ts
// cleanExpiredSessions — same schedule, same hard-delete-past-expiresAt approach.
// AdminSession has no isActive/revokedAt (unlike the main app's Session), so
// there's no "soft-revoke then purge later" step — expired rows are deleted
// outright, platform-wide (not scoped to whoever happens to open their
// profile page).

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLogger } from '@cykruit/logger';
import { PrismaService } from '@cykruit/prisma';

@Injectable()
export class SessionCleanupService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLogger,
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    async cleanExpiredSessions(): Promise<void> {
        try {
            const result = await this.prisma.adminSession.deleteMany({
                where: { expiresAt: { lt: new Date() } },
            });
            if (result.count > 0) {
                this.logger.log(
                    `[CLEANUP] Deleted ${result.count} expired admin session(s)`,
                    'SessionCleanupService',
                );
            }
        } catch (error) {
            this.logger.error(
                '[CLEANUP] Failed to clean expired admin sessions',
                error?.stack,
                'SessionCleanupService',
            );
        }
    }
}
