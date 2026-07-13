-- NOTE: `prisma migrate dev` generated a spurious `DROP INDEX "jobs_embedding_idx"`
-- here. That ivfflat index (on the Unsupported("vector(1536)") jobs.embedding
-- column, added by 20260713090000_fix_ai_schema_vector_columns) can't be
-- represented in schema.prisma, so Prisma's diff engine doesn't know it should
-- exist and tries to drop it on every subsequent `migrate dev` run. Removed —
-- this migration should only add platform_settings.

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- CreateIndex
CREATE INDEX "platform_settings_key_idx" ON "platform_settings"("key");
