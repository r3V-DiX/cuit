
-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "domainId" UUID;

-- CreateTable
CREATE TABLE "job_domains" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_domains_name_key" ON "job_domains"("name");

-- CreateIndex
CREATE UNIQUE INDEX "job_domains_slug_key" ON "job_domains"("slug");

-- CreateIndex
CREATE INDEX "job_domains_isActive_sortOrder_idx" ON "job_domains"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "roles_domainId_idx" ON "roles"("domainId");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "job_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_domains" ADD CONSTRAINT "job_domains_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

