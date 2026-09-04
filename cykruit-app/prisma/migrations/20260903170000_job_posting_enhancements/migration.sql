-- Step 1: Alter experienceLevel column to text temporarily
ALTER TABLE "jobs" ALTER COLUMN "experienceLevel" TYPE text;

-- Step 2: Drop and recreate enum type with new values
DROP TYPE IF EXISTS "ExperienceLevel";
CREATE TYPE "ExperienceLevel" AS ENUM ('ASSOCIATE', 'MID', 'SENIOR', 'EXECUTIVE');

-- Step 3: Migrate any existing 'ENTRY' rows to 'ASSOCIATE'
UPDATE "jobs" SET "experienceLevel" = 'ASSOCIATE' WHERE "experienceLevel" = 'ENTRY';

-- Step 4: Cast column back to the new ExperienceLevel enum
ALTER TABLE "jobs" ALTER COLUMN "experienceLevel" TYPE "ExperienceLevel" USING ("experienceLevel"::"ExperienceLevel");

-- Step 5: AlterTable: rename contractDuration to durationMonths
ALTER TABLE "jobs" RENAME COLUMN "contractDuration" TO "durationMonths";

-- Step 6: AlterTable: add domainId column
ALTER TABLE "jobs" ADD COLUMN "domainId" UUID;

-- CreateIndex: jobs_domainId_idx
CREATE INDEX "jobs_domainId_idx" ON "jobs"("domainId");

-- AddForeignKey: jobs_domainId_fkey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "job_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: AlterTable: add jobCode column
ALTER TABLE "jobs" ADD COLUMN "jobCode" VARCHAR(20);

-- Backfill jobCode for existing jobs
UPDATE "jobs" SET "jobCode" = CONCAT('CYK-', UPPER(SUBSTRING(REPLACE("id"::text, '-', ''), 1, 6))) WHERE "jobCode" IS NULL;

-- Handle any duplicate backfills if any
UPDATE "jobs" j1
SET "jobCode" = CONCAT('CYK-', UPPER(SUBSTRING(REPLACE(j1."id"::text, '-', ''), 1, 6)), '-', SUBSTRING(j1."id"::text, 33, 4))
WHERE EXISTS (
    SELECT 1 FROM "jobs" j2 WHERE j2."jobCode" = j1."jobCode" AND j2."id" <> j1."id"
);

-- Set NOT NULL and UNIQUE constraint on jobCode
ALTER TABLE "jobs" ALTER COLUMN "jobCode" SET NOT NULL;
CREATE UNIQUE INDEX "jobs_jobCode_key" ON "jobs"("jobCode");
