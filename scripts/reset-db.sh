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

echo -e "${YELLOW}WARNING: This will DELETE all users, employers, seekers, jobs, sessions, applications, and subscriptions.${NC}"
echo -e "${YELLOW}Reference data (skills, locations, certifications, institutes, packages, admins) is preserved.${NC}"
echo ""
read -rp "Type 'yes' to confirm: " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 0; }

echo -e "${GREEN}[INFO]${NC} Resetting user/employer/job data..."

docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  --network cykruit-v2_default \
  postgres:15-alpine \
  psql "$DATABASE_URL" <<'SQL'
-- Disable FK checks via deferred or truncate cascade
TRUNCATE TABLE
  admin_sessions,
  audit_logs,
  admin_audit_logs,
  auth_audit_logs,
  admin_auth_audit_logs,
  conversations,
  messages,
  notifications,
  payment_orders,
  payments,
  employer_subscriptions,
  saved_jobs,
  profile_views,
  job_views,
  company_profile_views,
  seeker_job_matches,
  applications,
  job_skills,
  job_certifications,
  jobs,
  employer_members,
  employer_verifications,
  company_benefits,
  company_media,
  employer_settings,
  employers,
  job_seeker_skills,
  job_seeker_certifications,
  job_seeker_profiles,
  seeker_job_preferences,
  job_seeker_settings,
  user_oauth_providers,
  user_role_assignments,
  user_permission_overrides,
  tokens,
  sessions,
  users
CASCADE;
SQL

echo -e "${GREEN}[INFO]${NC} Done. Reference data preserved. Re-run seed if needed:"
echo "  docker compose exec auth-service npx prisma db seed"
