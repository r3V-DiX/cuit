-- CreateTable
CREATE TABLE "policy_configs" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "policy_configs_key_key" ON "policy_configs"("key");

-- CreateIndex
CREATE INDEX "policy_configs_key_idx" ON "policy_configs"("key");
