-- Restores the "resume_embeddings" table, accidentally dropped by
-- 20260903110000_drop_dead_schema (the table is live but was only accessed
-- via raw SQL from ai-service, which a Prisma-accessor dead-code check missed).

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

ALTER TABLE "resume_embeddings" ADD CONSTRAINT "resume_embeddings_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
