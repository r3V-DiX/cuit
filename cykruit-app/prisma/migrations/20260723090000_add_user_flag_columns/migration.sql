-- AlterTable
ALTER TABLE "users" ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "flaggedBy" UUID,
ADD COLUMN     "flaggedReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false;
