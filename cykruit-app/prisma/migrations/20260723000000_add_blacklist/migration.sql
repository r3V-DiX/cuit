-- CreateEnum
CREATE TYPE "BlacklistType" AS ENUM ('EMAIL', 'DOMAIN');

-- CreateTable
CREATE TABLE "blacklist" (
    "id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "type" "BlacklistType" NOT NULL,
    "reason" TEXT,
    "addedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_value_key" ON "blacklist"("value");

-- CreateIndex
CREATE INDEX "blacklist_type_value_idx" ON "blacklist"("type", "value");

-- AddForeignKey
ALTER TABLE "blacklist" ADD CONSTRAINT "blacklist_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
