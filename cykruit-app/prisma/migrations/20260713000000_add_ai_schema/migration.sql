-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable: add embedding fields to jobs
ALTER TABLE "jobs"
    ADD COLUMN "embedding" vector(1536),
    ADD COLUMN "embeddedAt" TIMESTAMP(3);

-- IVFFlat index for cosine similarity search on jobs
CREATE INDEX "jobs_embedding_idx" ON "jobs" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

-- CreateTable: cached resume embeddings (one per seeker)
CREATE TABLE "resume_embeddings" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "embeddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resume_embeddings_seekerId_key" ON "resume_embeddings"("seekerId");
CREATE INDEX "resume_embeddings_seekerId_idx" ON "resume_embeddings"("seekerId");

ALTER TABLE "resume_embeddings"
    ADD CONSTRAINT "resume_embeddings_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: cached seeker <-> job match scores
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
