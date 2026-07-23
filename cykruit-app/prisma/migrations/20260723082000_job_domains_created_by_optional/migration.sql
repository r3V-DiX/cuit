-- DropForeignKey
ALTER TABLE "job_domains" DROP CONSTRAINT "job_domains_createdBy_fkey";

-- AlterTable
ALTER TABLE "job_domains" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "job_domains" ADD CONSTRAINT "job_domains_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

