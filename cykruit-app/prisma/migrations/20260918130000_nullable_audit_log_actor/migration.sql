-- AlterTable: system/cron-triggered audit entries have no real User actor
ALTER TABLE "audit_logs" ALTER COLUMN "actorId" DROP NOT NULL;
