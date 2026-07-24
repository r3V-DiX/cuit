#!/bin/bash
# reset-db.sh — full DB wipe + re-run all migrations (like prisma migrate reset)
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
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?.*$//')

echo -e "${RED}WARNING: This will DROP the entire database schema and re-run all migrations.${NC}"
echo -e "${RED}ALL data will be lost — users, admins, jobs, skills, locations, everything.${NC}"
echo ""
read -rp "Type 'yes' to confirm: " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 0; }

echo -e "${GREEN}[INFO]${NC} Dropping public schema..."
docker run --rm \
  --network cykruit-v2_default \
  postgres:15-alpine \
  psql "$PSQL_URL" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo -e "${GREEN}[INFO]${NC} Re-running all migrations..."
docker exec cykruit-v2-auth-service-1 npx prisma migrate deploy

echo -e "${GREEN}[INFO]${NC} Running prisma seed (skills, locations, packages)..."
if docker exec cykruit-v2-auth-service-1 \
  node_modules/.bin/tsx prisma/seed/index.ts; then
  echo -e "${GREEN}[INFO]${NC} Prisma seed completed."
else
  echo -e "${YELLOW}[WARN]${NC} Prisma seed failed — seeding admin manually..."
  ADMIN_HASH=$(docker exec cykruit-v2-auth-service-1 node -e \
    "const b=require('bcryptjs');b.hash('Admin@123',10).then(h=>process.stdout.write(h))")
  docker run --rm \
    --network cykruit-v2_default \
    postgres:15-alpine \
    psql "$PSQL_URL" -v ON_ERROR_STOP=1 -c "
      INSERT INTO admins (id, email, password, \"firstName\", \"lastName\", \"createdAt\", \"updatedAt\")
      VALUES (gen_random_uuid(), 'admin@cykruit.com', '$ADMIN_HASH', 'Super', 'Admin', now(), now())
      ON CONFLICT (email) DO NOTHING;"
  echo -e "${GREEN}[INFO]${NC} Admin created: admin@cykruit.com / Admin@123"
  echo -e "${YELLOW}[WARN]${NC} Skills/locations/packages NOT seeded — run prisma db seed manually after fixing ts-node."
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  DB fully reset and migrated.${NC}"
echo -e "${GREEN}  Run seed-test-data.sh to create test accounts.${NC}"
echo -e "${GREEN}================================================${NC}"
echo "  sudo bash ${DEPLOY_DIR}/scripts/seed-test-data.sh"
