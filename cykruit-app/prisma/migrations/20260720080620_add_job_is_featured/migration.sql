-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "jobs_isFeatured_idx" ON "jobs"("isFeatured");
