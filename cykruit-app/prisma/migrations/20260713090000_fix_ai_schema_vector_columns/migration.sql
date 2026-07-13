-- 20260713052340_init (the squashed baseline) was generated without the
-- pgvector extension active in that environment, so Prisma's introspection
-- silently dropped the two Unsupported("vector(1536)") columns schema.prisma
-- still declares: Job.embedding and ResumeEmbedding.embedding. Per
-- PRISMA_GUIDE.md rule 1, that merged migration is not edited — this adds
-- what it was missing instead.

-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable: add the missing embedding column to jobs (embeddedAt already exists)
ALTER TABLE "jobs" ADD COLUMN "embedding" vector(1536);

-- IVFFlat index for cosine similarity search on jobs
CREATE INDEX "jobs_embedding_idx" ON "jobs" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

-- AlterTable: add the missing embedding column to resume_embeddings
ALTER TABLE "resume_embeddings" ADD COLUMN "embedding" vector(1536) NOT NULL;
