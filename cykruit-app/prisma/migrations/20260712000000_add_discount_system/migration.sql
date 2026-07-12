-- CreateEnum
CREATE TYPE "DiscountTrigger" AS ENUM ('COUPON_CODE', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "DiscountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DiscountApplicability" AS ENUM ('ALL_PACKAGES', 'SPECIFIC_PACKAGES');

-- CreateTable
CREATE TABLE "discounts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "trigger" "DiscountTrigger" NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "maxDiscountCap" INTEGER,
    "minOrderAmountPaise" INTEGER,
    "applicability" "DiscountApplicability" NOT NULL DEFAULT 'ALL_PACKAGES',
    "billingCycles" "BillingCycle"[],
    "maxTotalUses" INTEGER,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "DiscountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "conditions" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_packages" (
    "id" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "packageId" TEXT NOT NULL,

    CONSTRAINT "discount_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_usages" (
    "id" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "employerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountSavedPaise" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_usages_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add discount fields to payment_orders
ALTER TABLE "payment_orders"
    ADD COLUMN "discountAmountPaise" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "discountId" UUID,
    ADD COLUMN "couponCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");

CREATE INDEX "discounts_code_idx" ON "discounts"("code");
CREATE INDEX "discounts_status_idx" ON "discounts"("status");
CREATE INDEX "discounts_trigger_idx" ON "discounts"("trigger");
CREATE INDEX "discounts_startsAt_expiresAt_idx" ON "discounts"("startsAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "discount_packages_discountId_packageId_key" ON "discount_packages"("discountId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "discount_usages_orderId_key" ON "discount_usages"("orderId");

CREATE INDEX "discount_usages_discountId_idx" ON "discount_usages"("discountId");
CREATE INDEX "discount_usages_employerId_idx" ON "discount_usages"("employerId");
CREATE INDEX "discount_usages_createdAt_idx" ON "discount_usages"("createdAt");

-- CreateIndex
CREATE INDEX "payment_orders_discountId_idx" ON "payment_orders"("discountId");

-- AddForeignKey
ALTER TABLE "discount_packages" ADD CONSTRAINT "discount_packages_discountId_fkey"
    FOREIGN KEY ("discountId") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discount_packages" ADD CONSTRAINT "discount_packages_packageId_fkey"
    FOREIGN KEY ("packageId") REFERENCES "subscription_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_discountId_fkey"
    FOREIGN KEY ("discountId") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_employerId_fkey"
    FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_discountId_fkey"
    FOREIGN KEY ("discountId") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
