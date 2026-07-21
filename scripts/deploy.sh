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
BACKEND_ENV="${DEPLOY_DIR}/.env.${ENV}"
ADMIN_ENV="${DEPLOY_DIR}/.env.${ENV}.admin"
CYKRUIT_SERVICES=(ai-service auth-service user-settings-service seeker-profile-service employer-service seeker-service public-service notification-service subscription-service gateway)

# ── Helpers ────────────────────────────────────────────────────────────────────
pull_with_fallback() {
  local repo="$1" service="$2" env="$3" sha="$4"
  local sha_tag="${service}-${env}-${sha}"
  local latest_tag="${service}-${env}-latest"
  if [ "$sha" = "latest" ]; then
    info "  ${service}: ${latest_tag}"
    docker pull "$ECR_REGISTRY/${repo}:${latest_tag}"
  elif docker pull "$ECR_REGISTRY/${repo}:${sha_tag}" > /dev/null 2>&1; then
    info "  ${service}: ${sha_tag}"
  else
    warn "  ${service}: ${sha_tag} not in ECR — falling back to ${latest_tag}"
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
        | jq -r '.Health // .Status' 2>/dev/null || echo "unknown")
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

  for key in google-oauth razorpay aws-s3-credentials ai-vendor-keys; do
    aws secretsmanager get-secret-value --region ap-south-1 \
      --secret-id "/cykruit-v2/${ENV}/backend/${key}" --query SecretString --output text \
    | jq -r 'to_entries[] | "\(.key)=\(.value)"' >> "$BACKEND_ENV"
  done

  # bedrock-credentials is optional
  if local bedrock_secret
     bedrock_secret=$(aws secretsmanager get-secret-value --region ap-south-1 \
       --secret-id "/cykruit-v2/${ENV}/backend/bedrock-credentials" \
       --query SecretString --output text 2>/dev/null); then
    echo "$bedrock_secret" | jq -r 'to_entries[] | "\(.key)=\(.value)"' >> "$BACKEND_ENV"
  else
    warn "bedrock-credentials not found — skipping (Bedrock features unavailable)"
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

  grep -E "^(DATABASE_URL|REDIS_HOST|REDIS_PORT|REDIS_PASSWORD|EMAIL_FROM)=" "$BACKEND_ENV" >> "$ADMIN_ENV"

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

do_cykruit_app() {
  step "Pulling cykruit-app (sha=$TAG, fallback=latest per service)..."
  for svc in "${CYKRUIT_SERVICES[@]}"; do
    pull_with_fallback cykruit-app "$svc" "$ENV" "$TAG"
  done
  step "Starting cykruit-app..."
  export CYKRUIT_APP_TAG="$TAG"
  docker compose up -d "${CYKRUIT_SERVICES[@]}"
  wait_healthy auth-service gateway
}

do_admin_app() {
  step "Pulling admin-app ($TAG)..."
  export ADMIN_APP_TAG="$TAG"
  docker compose pull admin-app
  docker compose up -d admin-app
  wait_healthy admin-app
}

do_cykruit_ui() {
  step "Pulling cykruit-ui ($TAG)..."
  export CYKRUIT_UI_TAG="$TAG"
  docker compose pull cykruit-ui
  docker compose up -d cykruit-ui
  wait_healthy cykruit-ui
}

do_admin_ui() {
  step "Pulling admin-ui ($TAG)..."
  export ADMIN_UI_TAG="$TAG"
  docker compose pull admin-ui
  docker compose up -d admin-ui
  wait_healthy admin-ui
}

# ── Main menu ──────────────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "   Cykruit v2 — Deploy ($ENV)"
echo "=========================================="
echo ""
echo "  1) cykruit-app  (all 10 microservices)"
echo "  2) admin-app"
echo "  3) cykruit-ui"
echo "  4) admin-ui"
echo "  5) migrate      (prisma migrate deploy)"
echo "  6) All services (migrate + all 4 apps)"
echo "  7) Build env    (pull secrets from SSM)"
echo "  8) Build env + Full deploy"
echo ""
read -rp "Select (1-8): " OPT

case "$OPT" in
  1|2|3|4|5)
    resolve_tag
    cd "$DEPLOY_DIR"
    export ENV="$ENV"
    export REDIS_PASSWORD
    REDIS_PASSWORD=$(grep '^REDIS_PASSWORD=' "$BACKEND_ENV" | cut -d'=' -f2-)
    ecr_login
    step "Pruning docker system..."
    docker system prune -af
    case "$OPT" in
      1) do_cykruit_app ;;
      2) do_admin_app   ;;
      3) do_cykruit_ui  ;;
      4) do_admin_ui    ;;
      5) do_migrate     ;;
    esac
    ;;
  6)
    resolve_tag
    warn "This will redeploy ALL services + run migrations."
    read -rp "Confirm? (yes/no): " C; [ "$C" = "yes" ] || { info "Aborted."; exit 0; }
    cd "$DEPLOY_DIR"
    export ENV="$ENV"
    export REDIS_PASSWORD
    REDIS_PASSWORD=$(grep '^REDIS_PASSWORD=' "$BACKEND_ENV" | cut -d'=' -f2-)
    ecr_login
    step "Pruning docker system..."
    docker system prune -af
    do_migrate
    do_cykruit_app
    do_admin_app
    do_cykruit_ui
    do_admin_ui
    ;;
  7)
    do_build_env
    ;;
  8)
    do_build_env
    resolve_tag
    warn "This will rebuild env + redeploy ALL services + run migrations."
    read -rp "Confirm? (yes/no): " C; [ "$C" = "yes" ] || { info "Aborted."; exit 0; }
    cd "$DEPLOY_DIR"
    export ENV="$ENV"
    export REDIS_PASSWORD
    REDIS_PASSWORD=$(grep '^REDIS_PASSWORD=' "$BACKEND_ENV" | cut -d'=' -f2-)
    ecr_login
    step "Pruning docker system..."
    docker system prune -af
    do_migrate
    do_cykruit_app
    do_admin_app
    do_cykruit_ui
    do_admin_ui
    ;;
  *)
    error "Invalid option: $OPT"
    exit 1
    ;;
esac

echo ""
info "Done. Current status:"
cd "$DEPLOY_DIR" && ENV="$ENV" docker compose ps
