-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "employerId" TEXT;

-- CreateIndex
CREATE INDEX "tokens_employerId_type_idx" ON "tokens"("employerId", "type");

-- CreateIndex
CREATE INDEX "tokens_type_expiresAt_usedAt_idx" ON "tokens"("type", "expiresAt", "usedAt");

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
