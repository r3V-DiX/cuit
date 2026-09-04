-- AlterTable: add jobCodePrefix and nextJobCodeNumber to employers
ALTER TABLE "employers" ADD COLUMN "jobCodePrefix" VARCHAR(10);
ALTER TABLE "employers" ADD COLUMN "nextJobCodeNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex: employers_jobCodePrefix_key
CREATE UNIQUE INDEX "employers_jobCodePrefix_key" ON "employers"("jobCodePrefix");
