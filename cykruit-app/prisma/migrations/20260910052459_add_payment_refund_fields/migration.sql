-- AlterEnum
ALTER TYPE "PaymentOrderStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "razorpayRefundId" TEXT,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayRefundId_key" ON "payments"("razorpayRefundId");

