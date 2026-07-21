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

ENV="$1"        # staging | prod
TARGET="$2"     # cykruit-app | admin-app | cykruit-ui | admin-ui | migrate
TAG="$3"        # git sha

ECR_REGISTRY="443370715886.dkr.ecr.ap-south-1.amazonaws.com"

cd /opt/cykruit-v2
export ENV="$ENV"

# redis service's ${REDIS_PASSWORD} interpolation needs this in the shell -
# env_file only injects vars into containers, not into compose's own interpolation.
export REDIS_PASSWORD
REDIS_PASSWORD=$(grep '^REDIS_PASSWORD=' "/opt/cykruit-v2/.env.$ENV" | cut -d'=' -f2-)

step "ECR login..."
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"
info "ECR login OK"

# Prune only images older than 72h — avoids deleting layers mid-pull
# when running concurrent or back-to-back deploys.
step "Pruning stale images (>72h old)..."
docker image prune -af --filter "until=72h"

wait_healthy() {
  local services=("$@")
  local deadline=$(( $(date +%s) + 120 ))
  info "Waiting for services to become healthy: ${services[*]}"
  while [ "$(date +%s)" -lt "$deadline" ]; do
    all_healthy=true
    for svc in "${services[@]}"; do
      status=$(docker compose ps --format json "$svc" 2>/dev/null \
        | jq -r '.Health // .Status' 2>/dev/null || echo "unknown")
      if [ "$status" != "healthy" ] && [ "$status" != "running" ]; then
        all_healthy=false
        break
      fi
    done
    $all_healthy && { info "All healthy."; return 0; }
    sleep 5
  done
  warn "Timed out waiting for healthy status — check: docker compose ps"
}

case "$TARGET" in
  migrate)
    step "Running prisma migrate deploy..."
    docker run --rm --env-file "/opt/cykruit-v2/.env.$ENV" \
      "$ECR_REGISTRY/cykruit-app:auth-service-$ENV-$TAG" \
      npx prisma migrate deploy
    info "Migration complete."
    ;;
  cykruit-app)
    export CYKRUIT_APP_TAG="$TAG"
    step "Pulling cykruit-app ($TAG)..."
    docker compose pull \
      ai-service auth-service user-settings-service seeker-profile-service \
      employer-service seeker-service public-service notification-service \
      subscription-service gateway
    step "Starting cykruit-app..."
    docker compose up -d \
      ai-service auth-service user-settings-service seeker-profile-service \
      employer-service seeker-service public-service notification-service \
      subscription-service gateway
    wait_healthy auth-service gateway
    ;;
  admin-app)
    export ADMIN_APP_TAG="$TAG"
    step "Pulling admin-app ($TAG)..."
    docker compose pull admin-app
    docker compose up -d admin-app
    wait_healthy admin-app
    ;;
  cykruit-ui)
    export CYKRUIT_UI_TAG="$TAG"
    step "Pulling cykruit-ui ($TAG)..."
    docker compose pull cykruit-ui
    docker compose up -d cykruit-ui
    wait_healthy cykruit-ui
    ;;
  admin-ui)
    export ADMIN_UI_TAG="$TAG"
    step "Pulling admin-ui ($TAG)..."
    docker compose pull admin-ui
    docker compose up -d admin-ui
    wait_healthy admin-ui
    ;;
  *)
    error "Unknown target: $TARGET"
    exit 1
    ;;
esac
