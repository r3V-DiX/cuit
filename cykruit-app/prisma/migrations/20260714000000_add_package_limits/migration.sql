-- AddColumn: subscription_packages — new feature-flag columns
-- All columns have DEFAULT values so existing rows are non-null immediately.
-- No data migration required.

ALTER TABLE "subscription_packages"
  ADD COLUMN IF NOT EXISTS "jobPostingPeriodDays"    INTEGER NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS "resumeViewEnabled"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canExportApplicants"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "analyticsEnabled"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "prioritySupportEnabled"   BOOLEAN NOT NULL DEFAULT false;
