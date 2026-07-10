-- CreateIndex
CREATE INDEX "jobs_status_expiresAt_idx" ON "jobs"("status", "expiresAt");
