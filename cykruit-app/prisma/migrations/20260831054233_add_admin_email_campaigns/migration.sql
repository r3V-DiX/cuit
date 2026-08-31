-- CreateEnum
CREATE TYPE "EmailRecipientType" AS ENUM ('SEGMENT', 'CUSTOM_LIST');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_FAILED');

-- CreateTable
CREATE TABLE "admin_email_campaigns" (
    "id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "recipient_type" "EmailRecipientType" NOT NULL,
    "segment_target" TEXT,
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'QUEUED',
    "error_message" TEXT,
    "created_by_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_email_recipient_logs" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_email_recipient_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_email_campaigns_status_idx" ON "admin_email_campaigns"("status");

-- CreateIndex
CREATE INDEX "admin_email_campaigns_created_by_id_idx" ON "admin_email_campaigns"("created_by_id");

-- CreateIndex
CREATE INDEX "admin_email_campaigns_created_at_idx" ON "admin_email_campaigns"("created_at");

-- CreateIndex
CREATE INDEX "admin_email_recipient_logs_campaign_id_idx" ON "admin_email_recipient_logs"("campaign_id");

-- CreateIndex
CREATE INDEX "admin_email_recipient_logs_email_idx" ON "admin_email_recipient_logs"("email");

-- AddForeignKey
ALTER TABLE "admin_email_campaigns" ADD CONSTRAINT "admin_email_campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_email_recipient_logs" ADD CONSTRAINT "admin_email_recipient_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "admin_email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
