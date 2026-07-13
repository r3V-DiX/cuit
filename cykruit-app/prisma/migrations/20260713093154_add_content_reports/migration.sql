-- CreateEnum
CREATE TYPE "FlaggedContentType" AS ENUM ('JOB', 'EMPLOYER_PROFILE', 'SEEKER_PROFILE', 'MESSAGE');

-- CreateEnum
CREATE TYPE "FlagReason" AS ENUM ('SPAM', 'INAPPROPRIATE', 'MISLEADING', 'FAKE_COMPANY', 'HARASSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FlagStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED_REMOVED', 'RESOLVED_DISMISSED');

-- NOTE: Prisma's diff engine generated a spurious `DROP INDEX "jobs_embedding_idx"` here.
-- ivfflat indexes on Unsupported("vector(...)") columns aren't representable in schema.prisma,
-- so this is expected on every migration touching the schema — see PRISMA_GUIDE.md.
-- Intentionally omitted; the index is recreated out-of-band and the checksum re-stamped.

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "contentType" "FlaggedContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "reason" "FlagReason" NOT NULL,
    "description" TEXT,
    "status" "FlagStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_reports_contentType_contentId_idx" ON "content_reports"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");

-- CreateIndex
CREATE INDEX "content_reports_reporterId_idx" ON "content_reports"("reporterId");

-- CreateIndex
CREATE INDEX "content_reports_createdAt_idx" ON "content_reports"("createdAt");

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
