-- Non-vector tables (safe to apply without pgvector extension)
-- The embedding columns on 'jobs' and 'resume_embeddings.embedding'
-- must be added separately after pgvector is installed on the server.

CREATE TABLE "resume_embeddings" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "embeddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "resume_embeddings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "resume_embeddings_seekerId_key" ON "resume_embeddings"("seekerId");
CREATE INDEX "resume_embeddings_seekerId_idx" ON "resume_embeddings"("seekerId");
ALTER TABLE "resume_embeddings"
    ADD CONSTRAINT "resume_embeddings_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "seeker_job_matches" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seeker_job_matches_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "seeker_job_matches_seekerId_jobId_key" ON "seeker_job_matches"("seekerId", "jobId");
CREATE INDEX "seeker_job_matches_seekerId_idx" ON "seeker_job_matches"("seekerId");
CREATE INDEX "seeker_job_matches_jobId_idx" ON "seeker_job_matches"("jobId");
ALTER TABLE "seeker_job_matches"
    ADD CONSTRAINT "seeker_job_matches_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seeker_job_matches"
    ADD CONSTRAINT "seeker_job_matches_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
