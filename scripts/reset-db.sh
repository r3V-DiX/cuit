#!/bin/bash
# reset-db.sh — wipe all user/employer/job data, keep reference data (skills, locations, etc.)
# Run: sudo bash scripts/reset-db.sh
set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DEPLOY_DIR="/opt/cykruit-v2"
ENV_FILE="${DEPLOY_DIR}/.env.prod"
[ -f "${DEPLOY_DIR}/.env.staging" ] && ENV_FILE="${DEPLOY_DIR}/.env.staging"
[ -f "${DEPLOY_DIR}/.env.prod" ]    && ENV_FILE="${DEPLOY_DIR}/.env.prod"

DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d'=' -f2-)
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}[ERROR]${NC} DATABASE_URL not found in $ENV_FILE"
  exit 1
fi
# Strip Prisma-only query params (?schema=...) — invalid for psql
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?.*$//')

echo -e "${YELLOW}WARNING: This will DELETE all users, employers, seekers, jobs, sessions, applications, and subscriptions.${NC}"
echo -e "${YELLOW}Reference data (skills, locations, certifications, institutes, packages) is preserved.${NC}"
echo ""
read -rp "Type 'yes' to confirm: " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 0; }

echo -e "${GREEN}[INFO]${NC} Resetting user/employer/job data..."

docker run --rm \
  --network cykruit-v2_default \
  postgres:15-alpine \
  psql "$PSQL_URL" <<'SQL'
DO $$
DECLARE
  -- Tables to PRESERVE (reference / seed data + migrations)
  preserve TEXT[] := ARRAY[
    -- Reference / lookup data
    'skills',
    'skill_categories',
    'locations',
    'certifications',
    'institutes',
    'roles',
    'job_domains',
    'subscription_packages',
    'discounts',
    'discount_packages',
    -- Admin accounts and their RBAC
    'admins',
    'admin_invites',
    'admin_rbac_roles',
    'admin_role_permissions',
    'admin_permissions',
    'admin_role_assignments',
    'admin_permission_overrides',
    -- User RBAC definitions (not assignments)
    'permissions',
    'rbac_roles',
    'role_permissions',
    -- Platform config
    'platform_settings',
    'policy_configs',
    -- Migrations
    '_prisma_migrations'
  ];
  tbl TEXT;
  tables_to_truncate TEXT[];
BEGIN
  -- Collect all non-reference user tables
  SELECT array_agg(quote_ident(tablename))
  INTO tables_to_truncate
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN (SELECT unnest(preserve));

  IF tables_to_truncate IS NULL OR array_length(tables_to_truncate, 1) = 0 THEN
    RAISE NOTICE 'No tables to truncate.';
    RETURN;
  END IF;

  EXECUTE 'TRUNCATE TABLE ' || array_to_string(tables_to_truncate, ', ') || ' CASCADE';
  RAISE NOTICE 'Truncated % tables.', array_length(tables_to_truncate, 1);
END $$;
SQL

echo -e "${GREEN}[INFO]${NC} Done. Reference data preserved. Re-run seed if needed:"
echo "  sudo bash scripts/seed-test-data.sh"
