-- Backfill: legacy cancellations made before cancel-at-period-end existed set
-- status = 'CANCELLED' directly, revoking access immediately even though the
-- employer had paid for a period that had not yet ended (expiresAt in the future).
--
-- Convert those rows to the new model (status ACTIVE + cancelAtPeriodEnd flag) so
-- the employer keeps paid access until expiresAt and the plan can be resumed.
-- cancelRequestedAt is left NULL because the original cancel timestamp is not stored
-- for these legacy rows.
UPDATE "employer_subscriptions"
SET "status" = 'ACTIVE',
    "cancelAtPeriodEnd" = true
WHERE "status" = 'CANCELLED'
  AND ("expiresAt" IS NULL OR "expiresAt" > now());
