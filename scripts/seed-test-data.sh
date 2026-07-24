#!/bin/bash
# seed-test-data.sh — create test employer + seeker + jobs for full flow testing
# Run: sudo bash scripts/seed-test-data.sh
# Requires: containers running, .env.prod present
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
step()  { echo -e "${BLUE}[STEP]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }

DEPLOY_DIR="/opt/cykruit-v2"
ENV_FILE="${DEPLOY_DIR}/.env.prod"
[ -f "${DEPLOY_DIR}/.env.staging" ] && ENV_FILE="${DEPLOY_DIR}/.env.staging"
[ -f "${DEPLOY_DIR}/.env.prod" ]    && ENV_FILE="${DEPLOY_DIR}/.env.prod"

DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d'=' -f2-)
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi
# Strip Prisma-only query params (?schema=...) — invalid for psql
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?.*$//')

run_sql() {
  docker run --rm \
    --network cykruit-v2_default \
    postgres:15-alpine \
    psql "$PSQL_URL" -t -c "$1" 2>/dev/null | tr -d '[:space:]'
}

run_sql_multi() {
  docker run --rm \
    --network cykruit-v2_default \
    postgres:15-alpine \
    psql "$PSQL_URL" <<SQL
$1
SQL
}

# Hash password using bcrypt via node in the auth-service container
hash_password() {
  local plain="$1"
  docker exec cykruit-v2-auth-service-1 node -e \
    "const b=require('bcryptjs');b.hash('${plain}',10).then(h=>process.stdout.write(h))"
}

step "Seeding test data..."

# ── 1. Hash passwords ──────────────────────────────────────────────────────────
info "Hashing passwords..."
EMPLOYER1_HASH=$(hash_password "Test@1234")
EMPLOYER2_HASH=$(hash_password "Test@1234")
SEEKER_HASH=$(hash_password "Test@1234")
info "Done."

# ── 2. Get a valid location ID ─────────────────────────────────────────────────
LOCATION_ID=$(run_sql "SELECT id FROM locations WHERE city='Bengaluru' LIMIT 1;")
if [ -z "$LOCATION_ID" ]; then
  LOCATION_ID=$(run_sql "SELECT id FROM locations LIMIT 1;")
fi
info "Using location: $LOCATION_ID"

# ── 3. Get skill IDs ───────────────────────────────────────────────────────────
SKILL_REACT=$(run_sql "SELECT id FROM skills WHERE name='React' LIMIT 1;")
SKILL_NODE=$(run_sql "SELECT id FROM skills WHERE name='Node.js' LIMIT 1;")
SKILL_PYTHON=$(run_sql "SELECT id FROM skills WHERE name='Python' LIMIT 1;")
SKILL_SQL=$(run_sql "SELECT id FROM skills WHERE name='PostgreSQL' LIMIT 1;")
[ -z "$SKILL_REACT" ]  && SKILL_REACT=$(run_sql  "SELECT id FROM skills LIMIT 1;")
[ -z "$SKILL_NODE" ]   && SKILL_NODE=$(run_sql   "SELECT id FROM skills OFFSET 1 LIMIT 1;")
[ -z "$SKILL_PYTHON" ] && SKILL_PYTHON=$(run_sql "SELECT id FROM skills OFFSET 2 LIMIT 1;")
[ -z "$SKILL_SQL" ]    && SKILL_SQL=$(run_sql    "SELECT id FROM skills OFFSET 3 LIMIT 1;")

# ── 4. Get free subscription package ──────────────────────────────────────────
FREE_PKG_ID=$(run_sql "SELECT id FROM subscription_packages WHERE name='Free' LIMIT 1;")
info "Free package: $FREE_PKG_ID"

# ── 5. Create employer 1 ──────────────────────────────────────────────────────
step "Creating Employer 1 (TechCorp)..."
EMPLOYER1_USER_ID=$(run_sql "SELECT id FROM users WHERE email='yograj.hukumdar@rivedix.com' LIMIT 1;")

if [ -z "$EMPLOYER1_USER_ID" ]; then
  EMPLOYER1_USER_ID=$(run_sql "
    INSERT INTO users (id, email, password, first_name, last_name, role, status, is_email_verified, email_verified_at, created_at, updated_at)
    VALUES (gen_random_uuid(), 'yograj.hukumdar@rivedix.com', '$EMPLOYER1_HASH', 'Yograj', 'Hukumdar', 'EMPLOYER', 'ACTIVE', true, now(), now(), now())
    RETURNING id;")
  info "Created user: $EMPLOYER1_USER_ID"
else
  info "Employer 1 user already exists: $EMPLOYER1_USER_ID"
fi

EMPLOYER1_ID=$(run_sql "SELECT id FROM employers WHERE user_id='$EMPLOYER1_USER_ID' LIMIT 1;")
if [ -z "$EMPLOYER1_ID" ]; then
  EMPLOYER1_ID=$(run_sql "
    INSERT INTO employers (id, user_id, company_name, company_type, industry, company_size, location, slug, about, is_verified, is_active, profile_completion, created_at, updated_at)
    VALUES (gen_random_uuid(), '$EMPLOYER1_USER_ID', 'TechCorp Solutions', 'PRIVATE_LIMITED_COMPANY', 'TECHNOLOGY', 'SIZE_51_200', 'Bengaluru, Karnataka', 'techcorp-solutions', 'We build great software products.', true, true, 80, now(), now())
    RETURNING id;")
  info "Created employer: $EMPLOYER1_ID"

  # Free subscription
  if [ -n "$FREE_PKG_ID" ]; then
    run_sql_multi "
      INSERT INTO employer_subscriptions (id, employer_id, package_id, status, started_at, expires_at, created_at, updated_at)
      VALUES (gen_random_uuid(), '$EMPLOYER1_ID', '$FREE_PKG_ID', 'ACTIVE', now(), now() + interval '1 year', now(), now())
      ON CONFLICT DO NOTHING;"
    info "Assigned Free subscription"
  fi
fi

# ── 6. Create employer 2 ──────────────────────────────────────────────────────
step "Creating Employer 2 (StartupHub)..."
EMPLOYER2_USER_ID=$(run_sql "SELECT id FROM users WHERE email='employer2@test.com' LIMIT 1;")

if [ -z "$EMPLOYER2_USER_ID" ]; then
  EMPLOYER2_USER_ID=$(run_sql "
    INSERT INTO users (id, email, password, first_name, last_name, role, status, is_email_verified, email_verified_at, created_at, updated_at)
    VALUES (gen_random_uuid(), 'employer2@test.com', '$EMPLOYER2_HASH', 'Priya', 'Patel', 'EMPLOYER', 'ACTIVE', true, now(), now(), now())
    RETURNING id;")
  info "Created user: $EMPLOYER2_USER_ID"
else
  info "Employer 2 user already exists: $EMPLOYER2_USER_ID"
fi

EMPLOYER2_ID=$(run_sql "SELECT id FROM employers WHERE user_id='$EMPLOYER2_USER_ID' LIMIT 1;")
if [ -z "$EMPLOYER2_ID" ]; then
  EMPLOYER2_ID=$(run_sql "
    INSERT INTO employers (id, user_id, company_name, company_type, industry, company_size, location, slug, about, is_verified, is_active, profile_completion, created_at, updated_at)
    VALUES (gen_random_uuid(), '$EMPLOYER2_USER_ID', 'StartupHub Ventures', 'PRIVATE_LIMITED_COMPANY', 'TECHNOLOGY', 'SIZE_11_50', 'Mumbai, Maharashtra', 'startuphub-ventures', 'Early-stage startup building the future.', true, true, 70, now(), now())
    RETURNING id;")
  info "Created employer: $EMPLOYER2_ID"

  if [ -n "$FREE_PKG_ID" ]; then
    run_sql_multi "
      INSERT INTO employer_subscriptions (id, employer_id, package_id, status, started_at, expires_at, created_at, updated_at)
      VALUES (gen_random_uuid(), '$EMPLOYER2_ID', '$FREE_PKG_ID', 'ACTIVE', now(), now() + interval '1 year', now(), now())
      ON CONFLICT DO NOTHING;"
  fi
fi

# ── 7. Create jobs for employer 1 ─────────────────────────────────────────────
step "Creating jobs for TechCorp..."

create_job() {
  local emp_id="$1" title="$2" slug="$3" jtype="$4" wmode="$5" level="$6" desc="$7"
  local existing
  existing=$(run_sql "SELECT id FROM jobs WHERE slug='$slug' LIMIT 1;")
  if [ -z "$existing" ]; then
    local jid
    jid=$(run_sql "
      INSERT INTO jobs (id, employer_id, job_title, slug, job_type, work_mode, experience_level, description, application_type, status, location_id, published_at, expires_at, created_at, updated_at)
      VALUES (gen_random_uuid(), '$emp_id', '$title', '$slug', '$jtype', '$wmode', '$level', '$desc', 'DIRECT', 'APPROVED', $([ -n "$LOCATION_ID" ] && echo "'$LOCATION_ID'" || echo "NULL"), now(), now() + interval '45 days', now(), now())
      RETURNING id;")
    echo "$jid"
  else
    echo "$existing"
  fi
}

JOB1_ID=$(create_job "$EMPLOYER1_ID" "Senior React Developer" "senior-react-dev-techcorp" "FULL_TIME" "HYBRID" "SENIOR" "Build modern web applications using React and TypeScript.")
JOB2_ID=$(create_job "$EMPLOYER1_ID" "Backend Node.js Engineer" "backend-nodejs-techcorp" "FULL_TIME" "REMOTE" "MID" "Design and build scalable REST APIs using Node.js and PostgreSQL.")
JOB3_ID=$(create_job "$EMPLOYER2_ID" "Python Data Engineer" "python-data-engineer-startuphub" "FULL_TIME" "ONSITE" "MID" "Build data pipelines and analytics systems using Python.")
JOB4_ID=$(create_job "$EMPLOYER2_ID" "Full Stack Intern" "fullstack-intern-startuphub" "INTERNSHIP" "HYBRID" "ENTRY" "Work across the stack with React and Node.js. Great for freshers.")

info "Jobs: $JOB1_ID | $JOB2_ID | $JOB3_ID | $JOB4_ID"

# Add skills to jobs
for jid in "$JOB1_ID" "$JOB2_ID" "$JOB3_ID" "$JOB4_ID"; do
  for sid in "$SKILL_REACT" "$SKILL_NODE" "$SKILL_PYTHON" "$SKILL_SQL"; do
    [ -z "$sid" ] && continue
    run_sql_multi "INSERT INTO job_skills (id, job_id, skill_id) VALUES (gen_random_uuid(), '$jid', '$sid') ON CONFLICT DO NOTHING;" 2>/dev/null || true
  done
done

# ── 8. Create seeker ──────────────────────────────────────────────────────────
step "Creating Seeker (Arjun Dev)..."
SEEKER_USER_ID=$(run_sql "SELECT id FROM users WHERE email='yograjhukumdar0@gmail.com' LIMIT 1;")

if [ -z "$SEEKER_USER_ID" ]; then
  SEEKER_USER_ID=$(run_sql "
    INSERT INTO users (id, email, password, first_name, last_name, role, status, is_email_verified, email_verified_at, created_at, updated_at)
    VALUES (gen_random_uuid(), 'yograjhukumdar0@gmail.com', '$SEEKER_HASH', 'Yograj', 'Dev', 'SEEKER', 'ACTIVE', true, now(), now(), now())
    RETURNING id;")
  info "Created seeker user: $SEEKER_USER_ID"
fi

SEEKER_PROFILE_ID=$(run_sql "SELECT id FROM job_seeker_profiles WHERE user_id='$SEEKER_USER_ID' LIMIT 1;")
if [ -z "$SEEKER_PROFILE_ID" ]; then
  SEEKER_PROFILE_ID=$(run_sql "
    INSERT INTO job_seeker_profiles (id, user_id, first_name, last_name, title, professional_summary, profile_completion, created_at, updated_at)
    VALUES (gen_random_uuid(), '$SEEKER_USER_ID', 'Yograj', 'Dev', 'Full Stack Developer', 'Passionate developer with 3 years experience in React and Node.js.', 60, now(), now())
    RETURNING id;")
  info "Created seeker profile: $SEEKER_PROFILE_ID"

  # Add skills to seeker
  for sid in "$SKILL_REACT" "$SKILL_NODE"; do
    [ -z "$sid" ] && continue
    run_sql_multi "INSERT INTO job_seeker_skills (id, profile_id, skill_id, proficiency) VALUES (gen_random_uuid(), '$SEEKER_PROFILE_ID', '$sid', 'Expert') ON CONFLICT DO NOTHING;" 2>/dev/null || true
  done
fi

# ── 9. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "   Test Data Seeded"
echo "================================================"
echo ""
echo "  EMPLOYER 1 (TechCorp Solutions)"
echo "    Email:    yograj.hukumdar@rivedix.com"
echo "    Password: Test@1234"
echo ""
echo "  EMPLOYER 2 (StartupHub Ventures)"
echo "    Email:    employer2@test.com"
echo "    Password: Test@1234"
echo ""
echo "  SEEKER"
echo "    Email:    yograjhukumdar0@gmail.com"
echo "    Password: Test@1234"
echo ""
echo "  JOBS: 4 approved jobs (2 per employer)"
echo ""
echo "  NOTE: Login uses OTP. Trigger OTP via login page,"
echo "  or bypass by setting session directly in DB."
echo "================================================"
