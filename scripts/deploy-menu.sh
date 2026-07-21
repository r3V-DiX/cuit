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
  error "Please run as root: sudo bash deploy-menu.sh"
  exit 1
fi

if [ -f /opt/cykruit-v2/.env.prod ]; then
  ENV=prod
elif [ -f /opt/cykruit-v2/.env.staging ]; then
  ENV=staging
else
  error "Could not determine environment: no .env.prod or .env.staging found in /opt/cykruit-v2/"
  exit 1
fi

echo "=========================================="
echo "   Cykruit v2 - Deploy Menu ($ENV box)"
echo "=========================================="
echo ""
echo "  1) cykruit-app (all 10 microservices)"
echo "  2) admin-app"
echo "  3) cykruit-ui"
echo "  4) admin-ui"
echo "  5) migrate (prisma migrate deploy)"
echo "  6) All (migrate + cykruit-app + admin-app + cykruit-ui + admin-ui)"
echo ""
read -rp "Select target (1-6): " TARGET_OPTION

# Show recent ECR tags as a hint
ECR_REGISTRY="443370715886.dkr.ecr.ap-south-1.amazonaws.com"
info "Fetching recent tags from ECR..."
RECENT_TAGS=$(aws ecr describe-images \
  --region ap-south-1 \
  --repository-name cykruit-app \
  --query "sort_by(imageDetails,&imagePushedAt)[-5:].imageTags" \
  --output json 2>&1 \
  | jq -r '.[] | .[]? | select(startswith("auth-service-'"$ENV"'-"))' \
  | sed "s/auth-service-${ENV}-//" \
  | sort -u \
  | tail -5 \
  || echo "  (could not fetch — check IAM role has ecr:DescribeImages)")
echo ""
echo "  Recent tags for $ENV:"
echo "$RECENT_TAGS" | while read -r t; do echo "    $t"; done
echo ""

read -rp "Tag (short git sha, e.g. 0ce249c): " TAG

if [ "$TAG" = "latest" ]; then
  error "'latest' is not a valid deploy tag — CI does not push a 'latest' tag."
  error "Use an actual git SHA from the list above."
  exit 1
fi

if [[ ! "$TAG" =~ ^[0-9a-f]{7,40}$ ]]; then
  warn "Tag '$TAG' doesn't look like a git SHA. Continue anyway? (yes/no)"
  read -rp "" CONFIRM
  [ "$CONFIRM" = "yes" ] || exit 1
fi

case "$TARGET_OPTION" in
  1|2|3|4|5)
    /opt/cykruit-v2/deploy.sh "$ENV" \
      "$(case $TARGET_OPTION in 1) echo cykruit-app;; 2) echo admin-app;; 3) echo cykruit-ui;; 4) echo admin-ui;; 5) echo migrate;; esac)" \
      "$TAG"
    ;;
  6)
    warn "This will redeploy ALL services + run migrations."
    read -rp "Confirm? (yes/no): " CONFIRM
    [ "$CONFIRM" = "yes" ] || { info "Aborted."; exit 0; }
    step "migrate"
    /opt/cykruit-v2/deploy.sh "$ENV" migrate "$TAG"
    step "cykruit-app"
    /opt/cykruit-v2/deploy.sh "$ENV" cykruit-app "$TAG"
    step "admin-app"
    /opt/cykruit-v2/deploy.sh "$ENV" admin-app "$TAG"
    step "cykruit-ui"
    /opt/cykruit-v2/deploy.sh "$ENV" cykruit-ui "$TAG"
    step "admin-ui"
    /opt/cykruit-v2/deploy.sh "$ENV" admin-ui "$TAG"
    ;;
  *)
    error "Invalid option: $TARGET_OPTION"
    exit 1
    ;;
esac

echo ""
info "Done. Current status:"
cd /opt/cykruit-v2 && ENV="$ENV" docker compose ps
