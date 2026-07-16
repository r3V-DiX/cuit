-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "previousToken" TEXT,
ADD COLUMN     "previousTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "sessions_previousToken_idx" ON "sessions"("previousToken");
