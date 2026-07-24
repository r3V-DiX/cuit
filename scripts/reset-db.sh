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

echo -e "${YELLOW}WARNING: This will DELETE all users, employers, seekers, jobs, sessions, applications, subscriptions, and messages.${NC}"
echo -e "${YELLOW}Reference data (skills, locations, certifications, institutes, packages, admins) is preserved.${NC}"
echo ""
read -rp "Type 'yes' to confirm: " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 0; }

echo -e "${GREEN}[INFO]${NC} Resetting..."

# Truncate users CASCADE — all FK-dependent tables (employers, jobs, applications,
# sessions, profiles, messages, notifications, etc.) are wiped via cascade.
# Jobs table has no FK to users directly but FK to employers → cascades from there.
# Anything not cascading from users is listed explicitly below.
docker run --rm \
  --network cykruit-v2_default \
  postgres:15-alpine \
  psql "$PSQL_URL" -v ON_ERROR_STOP=1 <<'SQL'
-- Wipe all user-owned data via cascade from root tables
-- admins table is NOT included — preserve admin accounts
TRUNCATE TABLE
  users,
  employers
CASCADE;

-- Wipe any orphaned tables not reached by above cascade
TRUNCATE TABLE
  search_suggestions,
  blacklist,
  content_reports,
  announcements
CASCADE;
SQL

echo -e "${GREEN}[INFO]${NC} Done. Reference data and admin accounts preserved."
echo "  Re-seed: sudo bash scripts/seed-test-data.sh"
