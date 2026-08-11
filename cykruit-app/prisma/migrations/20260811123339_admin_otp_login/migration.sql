-- Switch admin console auth from password to email OTP.
-- AlterTable
ALTER TABLE "admins" DROP COLUMN "password";

-- CreateTable
CREATE TABLE "admin_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_tokens_token_key" ON "admin_tokens"("token");

-- CreateIndex
CREATE INDEX "admin_tokens_adminId_idx" ON "admin_tokens"("adminId");

-- CreateIndex
CREATE INDEX "admin_tokens_expiresAt_idx" ON "admin_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "admin_tokens" ADD CONSTRAINT "admin_tokens_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
