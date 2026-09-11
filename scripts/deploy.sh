#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
step()  { echo -e "${BLUE}[STEP]${NC}  $*"; }

# ── Dispatch mode: deploy.sh <env> dispatch <target> <tag> ────────────────────
# Runs on the CI runner, not the EC2 box (so it must come before the root
# check and DEPLOY_DIR/box-local setup below, neither of which apply here).
# Fires the real deploy.sh — this same file, already on the box at
# /opt/cykruit-v2/deploy.sh — via SSM Run Command, then polls for the actual result.
# `aws ssm send-command` on its own only confirms AWS *accepted* the request,
# never that the command succeeded on the box — every CI workflow used to call
# it directly and treat that acceptance as success, so a real migrate/deploy
# failure on the box still showed green in GitHub Actions.
if [ "${2:-}" = "dispatch" ]; then
  ENV="$1"; TARGET="$3"; TAG="${4:-latest}"
  [ "$ENV" = "staging" ] || [ "$ENV" = "prod" ] || { error "dispatch: env must be staging or prod, got '$ENV'"; exit 1; }
  INSTANCE_TAG="cykruit-v2-app-server-${ENV}"

  INSTANCE_ID=$(aws ec2 describe-instances --region ap-south-1 \
    --filters "Name=tag:Name,Values=${INSTANCE_TAG}" "Name=instance-state-name,Values=running" \
    --query "Reservations[0].Instances[0].InstanceId" --output text)
  [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ] || { error "dispatch: no running instance tagged Name=${INSTANCE_TAG}"; exit 1; }

  step "Dispatching ${ENV}: ${TARGET} (${TAG}) to ${INSTANCE_ID}..."
  CMD_ID=$(aws ssm send-command --region ap-south-1 \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "cykruit-v2 ${ENV}: ${TARGET} (${TAG})" \
    --parameters "commands=[\"/opt/cykruit-v2/deploy.sh ${ENV} ${TARGET} ${TAG}\"]" \
    --query "Command.CommandId" --output text)

  # Poll directly rather than `aws ssm wait command-executed` — that wait
  # command surfaces a failed terminal status as its own CLI error without the
  # box's actual output, which is the one thing worth seeing on failure.
  for _ in $(seq 1 90); do
    sleep 5
    STATUS=$(aws ssm get-command-invocation --region ap-south-1 \
      --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
      --query "Status" --output text 2>/dev/null || echo Pending)
    case "$STATUS" in
      Success)
        info "Dispatch succeeded."
        exit 0
        ;;
      Failed|Cancelled|TimedOut)
        error "Dispatch ${STATUS} — remote output:"
        aws ssm get-command-invocation --region ap-south-1 \
          --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
          --query "StandardOutputContent" --output text >&2
        aws ssm get-command-invocation --region ap-south-1 \
          --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" \
          --query "StandardErrorContent" --output text >&2
        exit 1
        ;;
    esac
  done
  error "dispatch: timed out after 7.5 minutes waiting for command ${CMD_ID}"
  exit 1
fi

if [ "$EUID" -ne 0 ]; then
  error "Please run as root: sudo bash deploy.sh"
  exit 1
fi

# ── Env detection ──────────────────────────────────────────────────────────────
if [ -f /opt/cykruit-v2/.env.prod ]; then
  ENV=prod
elif [ -f /opt/cykruit-v2/.env.staging ]; then
  ENV=staging
else
  error "No .env.prod or .env.staging found in /opt/cykruit-v2/"
  exit 1
fi

ECR_REGISTRY="443370715886.dkr.ecr.ap-south-1.amazonaws.com"
DEPLOY_DIR="/opt/cykruit-v2"
export COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"
BACKEND_ENV="${DEPLOY_DIR}/.env.${ENV}"
ADMIN_ENV="${DEPLOY_DIR}/.env.${ENV}.admin"
CYKRUIT_SERVICES=(ai-service auth-service user-settings-service seeker-profile-service employer-service seeker-service public-service notification-service subscription-service gateway)

# ── Helpers ────────────────────────────────────────────────────────────────────
pull_with_fallback() {
  local repo="$1" service="$2" env="$3" sha="$4"
  local sha_tag latest_tag label
  if [ -n "$service" ]; then
    sha_tag="${service}-${env}-${sha}"
    latest_tag="${service}-${env}-latest"
    label="$service"
  else
    sha_tag="${env}-${sha}"
    latest_tag="${env}-latest"
    label="$repo"
  fi
  if [ "$sha" = "latest" ]; then
    info "  ${label}: ${latest_tag}"
    docker pull "$ECR_REGISTRY/${repo}:${latest_tag}"
  elif docker pull "$ECR_REGISTRY/${repo}:${sha_tag}" > /dev/null 2>&1; then
    info "  ${label}: ${sha_tag}"
  else
    warn "  ${label}: ${sha_tag} not in ECR — falling back to ${latest_tag}"
    docker pull "$ECR_REGISTRY/${repo}:${latest_tag}"
    docker tag "$ECR_REGISTRY/${repo}:${latest_tag}" "$ECR_REGISTRY/${repo}:${sha_tag}"
  fi
}

wait_healthy() {
  local deadline=$(( $(date +%s) + 120 ))
  info "Waiting for: $*"
  while [ "$(date +%s)" -lt "$deadline" ]; do
    local all_healthy=true
    for svc in "$@"; do
      local status
      status=$(docker compose ps --format json "$svc" 2>/dev/null \
        | jq -r 'if (.Health // "" | length) > 0 then .Health else .Status end' 2>/dev/null || echo "unknown")
      if [ "$status" != "healthy" ] && [ "$status" != "running" ]; then
        all_healthy=false; break
      fi
    done
    $all_healthy && { info "All healthy."; return 0; }
    sleep 5
  done
  warn "Timed out — check: docker compose ps"
}

ecr_login() {
  step "Pruning docker system to free disk space..."
  docker system prune -af
  step "ECR login..."
  aws ecr get-login-password --region ap-south-1 | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"
  info "ECR login OK"
}


resolve_tag() {
  info "Fetching latest tag from ECR..."
  TAG=$(aws ecr describe-images \
    --region ap-south-1 \
    --repository-name cykruit-app \
    --query "sort_by(imageDetails,&imagePushedAt)[-1:].imageTags" \
    --output json 2>/dev/null \
    | jq -r '.[] | .[]? | select(startswith("auth-service-'"$ENV"'-")) | ltrimstr("auth-service-'"$ENV"'-")' \
    | tail -1 || true)
  if [ -z "$TAG" ]; then
    warn "No SHA tag found in ECR — using 'latest'"
    TAG="latest"
  else
    info "Auto-selected tag: $TAG"
  fi
}

# ── Build-env (SSM + Secrets Manager) ─────────────────────────────────────────
do_build_env() {
  step "Building env files from SSM + Secrets Manager (env=$ENV)..."

  : > "$BACKEND_ENV"; chmod 600 "$BACKEND_ENV"
  : > "$ADMIN_ENV";   chmod 600 "$ADMIN_ENV"

  aws ssm get-parameters-by-path --region ap-south-1 \
    --path "/cykruit-v2/${ENV}/backend/" --recursive --with-decryption \
    --query "Parameters[].{Name:Name,Value:Value}" --output json \
  | jq -r '.[] | "\(.Name | split("/") | last | ascii_upcase | gsub("-";"_"))=\(.Value)"' \
  >> "$BACKEND_ENV"

  aws ssm get-parameters-by-path --region ap-south-1 \
    --path "/cykruit-v2/${ENV}/admin-backend/" --recursive --with-decryption \
    --query "Parameters[].{Name:Name,Value:Value}" --output json \
  | jq -r '.[] | "\(.Name | split("/") | last | ascii_upcase | gsub("-";"_"))=\(.Value)"' \
  >> "$ADMIN_ENV"

  for key in db-password jwt-secret redis-password resend-api-key; do
    local val varname
    val=$(aws secretsmanager get-secret-value --region ap-south-1 \
      --secret-id "/cykruit-v2/${ENV}/backend/${key}" --query SecretString --output text \
      | jq -r '.[keys[0]]')
    varname=$(echo "$key" | tr 'a-z-' 'A-Z_')
    echo "${varname}=${val}" >> "$BACKEND_ENV"
  done

  # Assemble DATABASE_URL from parts (password URI-encoded for special chars)
  local db_host db_port db_password db_password_enc
  db_host=$(aws ssm get-parameter --region ap-south-1 \
    --name "/cykruit-v2/${ENV}/backend/db-host" --with-decryption \
    --query "Parameter.Value" --output text)
  db_port=$(aws ssm get-parameter --region ap-south-1 \
    --name "/cykruit-v2/${ENV}/backend/db-port" --with-decryption \
    --query "Parameter.Value" --output text)
  db_password=$(aws secretsmanager get-secret-value --region ap-south-1 \
    --secret-id "/cykruit-v2/${ENV}/backend/db-password" --query SecretString --output text \
    | jq -r '.[keys[0]]')
  db_password_enc=$(jq -rn --arg p "$db_password" '$p|@uri')
  echo "DATABASE_URL=postgresql://postgres:${db_password_enc}@${db_host}:${db_port}/cykruit?schema=public" \
    >> "$BACKEND_ENV"

  for key in google-oauth razorpay ai-vendor-keys; do
    aws secretsmanager get-secret-value --region ap-south-1 \
      --secret-id "/cykruit-v2/${ENV}/backend/${key}" --query SecretString --output text \
    | jq -r 'to_entries[] | "\(.key)=\(.value)"' >> "$BACKEND_ENV"
  done

  # aws-s3-credentials and bedrock-credentials are both optional: EC2's IAM
  # instance role authenticates S3/Bedrock directly, so these secrets are only
  # needed at all for local dev (see libs/upload/src/upload.service.ts and
  # libs/ai/src/providers/bedrock.provider.ts) - don't hard-fail if deleted.
  if s3_secret=$(aws secretsmanager get-secret-value --region ap-south-1 \
      --secret-id "/cykruit-v2/${ENV}/backend/aws-s3-credentials" \
      --query SecretString --output text 2>/dev/null); then
    echo "$s3_secret" | jq -r 'to_entries[] | "\(.key)=\(.value)"' >> "$BACKEND_ENV"
  else
    warn "aws-s3-credentials not found — skipping (S3 will use the EC2 instance role)"
  fi

  if local bedrock_secret
     bedrock_secret=$(aws secretsmanager get-secret-value --region ap-south-1 \
       --secret-id "/cykruit-v2/${ENV}/backend/bedrock-credentials" \
       --query SecretString --output text 2>/dev/null); then
    echo "$bedrock_secret" | jq -r 'to_entries[] | "\(.key)=\(.value)"' >> "$BACKEND_ENV"
  else
    warn "bedrock-credentials not found — skipping (Bedrock will use the EC2 instance role)"
  fi

  local admin_jwt admin_resend
  admin_jwt=$(aws secretsmanager get-secret-value --region ap-south-1 \
    --secret-id "/cykruit-v2/${ENV}/admin-backend/jwt-secret" --query SecretString --output text \
    | jq -r '.[keys[0]]')
  echo "JWT_SECRET=${admin_jwt}" >> "$ADMIN_ENV"

  admin_resend=$(aws secretsmanager get-secret-value --region ap-south-1 \
    --secret-id "/cykruit-v2/${ENV}/admin-backend/resend-api-key" --query SecretString --output text \
    | jq -r '.[keys[0]]')
  echo "RESEND_API_KEY=${admin_resend}" >> "$ADMIN_ENV"

  grep -E "^(DATABASE_URL|REDIS_HOST|REDIS_PORT|REDIS_PASSWORD|EMAIL_FROM|COOKIE_DOMAIN|COOKIE_SECURE|COOKIE_SAME_SITE|CORS_ORIGIN|AWS_REGION)=|^(S3_|AWS_S3_BUCKET_)" "$BACKEND_ENV" >> "$ADMIN_ENV"

  # Sync Docker Compose interpolation env (resolves ${REDIS_PASSWORD} in docker-compose.yml)
  local compose_env="${DEPLOY_DIR}/.env"
  : > "$compose_env"; chmod 600 "$compose_env"
  echo "ENV=${ENV}" >> "$compose_env"
  grep "^REDIS_PASSWORD=" "$BACKEND_ENV" >> "$compose_env"

  info "Wrote $(wc -l < "$BACKEND_ENV") lines to $BACKEND_ENV"
  info "Wrote $(wc -l < "$ADMIN_ENV") lines to $ADMIN_ENV"
}

# ── Deploy targets ─────────────────────────────────────────────────────────────
do_migrate() {
  step "Running prisma migrate deploy..."
  pull_with_fallback cykruit-app auth-service "$ENV" "$TAG"
  docker run --rm --env-file "$BACKEND_ENV" \
    "$ECR_REGISTRY/cykruit-app:auth-service-$ENV-$TAG" \
    npx prisma migrate deploy
  info "Migration complete."
}

do_seed() {
  step "Running prisma seed (skills, locations, packages, admins)..."
  pull_with_fallback cykruit-app auth-service "$ENV" "$TAG"
  docker run --rm --env-file "$BACKEND_ENV" \
    "$ECR_REGISTRY/cykruit-app:auth-service-$ENV-$TAG" \
    npx --yes tsx prisma/seed/index.ts
  info "Seed complete."
}

# ── Individual RBAC/policy seed scripts ───────────────────────────────────────
# Idempotent, but each is a deliberate on-demand action — never run
# automatically on container start (see admin-app/Dockerfile).
do_rbac_seed() {
  step "Running admin console RBAC seed (permission catalog, system roles, bootstrap super_admin)..."
  pull_with_fallback cykruit-admin-app "" "$ENV" "$TAG"
  docker run --rm --env-file "$ADMIN_ENV" \
    "$ECR_REGISTRY/cykruit-admin-app:$ENV-$TAG" \
    node -r ./tsconfig-paths-bootstrap.prod.js dist/admin-app/prisma/rbac-seed.js
  info "RBAC seed complete."
}

do_policy_seed() {
  step "Running policy-config seed (rate-limit/policy defaults)..."
  pull_with_fallback cykruit-admin-app "" "$ENV" "$TAG"
  docker run --rm --env-file "$ADMIN_ENV" \
    "$ECR_REGISTRY/cykruit-admin-app:$ENV-$TAG" \
    node -r ./tsconfig-paths-bootstrap.prod.js dist/admin-app/prisma/policy-seed.js
  info "Policy seed complete."
}

do_employer_rbac_seed() {
  step "Running employer RBAC seed (team-role permission catalog + defaults)..."
  pull_with_fallback cykruit-app auth-service "$ENV" "$TAG"
  docker run --rm --env-file "$BACKEND_ENV" \
    "$ECR_REGISTRY/cykruit-app:auth-service-$ENV-$TAG" \
    npx --yes tsx prisma/employer-rbac-seed.ts
  info "Employer RBAC seed complete."
}

do_cykruit_app() {
  step "Pulling cykruit-app (sha=$TAG, fallback=latest per service)..."
  for svc in "${CYKRUIT_SERVICES[@]}"; do
    pull_with_fallback cykruit-app "$svc" "$ENV" "$TAG"
  done
  step "Starting cykruit-app..."
  export CYKRUIT_APP_TAG="$TAG"
  docker compose up -d --force-recreate "${CYKRUIT_SERVICES[@]}"
  wait_healthy auth-service gateway
}

do_admin_app() {
  step "Pulling admin-app ($TAG)..."
  pull_with_fallback cykruit-admin-app "" "$ENV" "$TAG"
  export ADMIN_APP_TAG="$TAG"
  docker compose up -d --force-recreate admin-app
  wait_healthy admin-app
}

do_cykruit_ui() {
  step "Pulling cykruit-ui ($TAG)..."
  pull_with_fallback cykruit-ui "" "$ENV" "$TAG"
  export CYKRUIT_UI_TAG="$TAG"
  docker compose up -d --force-recreate cykruit-ui
  wait_healthy cykruit-ui
}

do_admin_ui() {
  step "Pulling admin-ui ($TAG)..."
  pull_with_fallback cykruit-admin-ui "" "$ENV" "$TAG"
  export ADMIN_UI_TAG="$TAG"
  docker compose up -d --force-recreate admin-ui
  wait_healthy admin-ui
}

run_deploy() {
  local target="$1"
  cd "$DEPLOY_DIR"
  export ENV="$ENV"
  export REDIS_PASSWORD
  REDIS_PASSWORD=$(grep '^REDIS_PASSWORD=' "$BACKEND_ENV" | cut -d'=' -f2-)
  ecr_login
  case "$target" in
    cykruit-app) do_cykruit_app ;;
    admin-app)   do_admin_app   ;;
    cykruit-ui)  do_cykruit_ui  ;;
    admin-ui)    do_admin_ui    ;;
    migrate)             do_migrate             ;;
    seed)                do_seed                ;;
    rbac-seed)           do_rbac_seed           ;;
    policy-seed)         do_policy_seed         ;;
    employer-rbac-seed)  do_employer_rbac_seed  ;;
    all)
      do_migrate
      do_seed
      do_rbac_seed
      do_policy_seed
      do_employer_rbac_seed
      do_cykruit_app
      do_admin_app
      do_cykruit_ui
      do_admin_ui
      ;;
    *) error "Unknown target: $target"; exit 1 ;;
  esac
}

# ── Non-interactive (CI): deploy.sh <env> <target> <tag> ──────────────────────
if [ $# -ge 2 ]; then
  # ENV already detected from .env file; $1 is just passed for compatibility
  TARGET="$2"
  TAG="${3:-latest}"
  info "CI mode: target=$TARGET tag=$TAG"
  run_deploy "$TARGET"
  echo ""
  info "Done. Current status:"
  cd "$DEPLOY_DIR" && ENV="$ENV" docker compose ps
  exit 0
fi

# ── Interactive menu ───────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "   Cykruit v2 — Deploy ($ENV)"
echo "=========================================="
echo ""
echo "  1) cykruit-app  (all 10 microservices)"
echo "  2) admin-app"
echo "  3) cykruit-ui"
echo "  4) admin-ui"
echo "  5) migrate             (prisma migrate deploy)"
echo "  6) seed                (prisma db seed — skills, locations, admins)"
echo "  7) rbac-seed           (admin console RBAC catalog/roles/bootstrap admin)"
echo "  8) policy-seed         (platform policy/rate-limit defaults)"
echo "  9) employer-rbac-seed  (employer team-role permission catalog/defaults)"
echo " 10) All services (migrate + all seeds + all 4 apps)"
echo " 11) Build env    (pull secrets from SSM)"
echo " 12) Build env + Full deploy"
echo ""
read -rp "Select (1-12): " OPT

case "$OPT" in
  1|2|3|4|5|6|7|8|9)
    resolve_tag
    run_deploy "$(case $OPT in 1) echo cykruit-app;; 2) echo admin-app;; 3) echo cykruit-ui;; 4) echo admin-ui;; 5) echo migrate;; 6) echo seed;; 7) echo rbac-seed;; 8) echo policy-seed;; 9) echo employer-rbac-seed;; esac)"
    ;;
  10)
    resolve_tag
    warn "This will redeploy ALL services + run migrations + all seeds."
    read -rp "Confirm? (yes/no): " C; [ "$C" = "yes" ] || { info "Aborted."; exit 0; }
    run_deploy all
    ;;
  11)
    do_build_env
    ;;
  12)
    do_build_env
    resolve_tag
    warn "This will rebuild env + redeploy ALL services + run migrations + all seeds."
    read -rp "Confirm? (yes/no): " C; [ "$C" = "yes" ] || { info "Aborted."; exit 0; }
    run_deploy all
    ;;
  *)
    error "Invalid option: $OPT"
    exit 1
    ;;
esac

echo ""
info "Done. Current status:"
cd "$DEPLOY_DIR" && ENV="$ENV" docker compose ps
