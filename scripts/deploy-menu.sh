#!/bin/bash
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo bash deploy-menu.sh" >&2
  exit 1
fi

if [ -f /opt/cykruit-v2/.env.prod ]; then
  ENV=prod
elif [ -f /opt/cykruit-v2/.env.staging ]; then
  ENV=staging
else  echo "Could not determine environment: no .env.prod or .env.staging found in /opt/cykruit-v2/" >&2
  exit 1fi

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
read -p "Select target (1-6): " TARGET_OPTION

read -p "Tag (short git sha, e.g. 0ce249c): " TAG

case "$TARGET_OPTION" in
  1) /opt/cykruit-v2/deploy.sh "$ENV" cykruit-app "$TAG" ;;
  2) /opt/cykruit-v2/deploy.sh "$ENV" admin-app "$TAG" ;;
  3) /opt/cykruit-v2/deploy.sh "$ENV" cykruit-ui "$TAG" ;;
  4) /opt/cykruit-v2/deploy.sh "$ENV" admin-ui "$TAG" ;;
  5) /opt/cykruit-v2/deploy.sh "$ENV" migrate "$TAG" ;;
  6)
    /opt/cykruit-v2/deploy.sh "$ENV" migrate "$TAG"
    /opt/cykruit-v2/deploy.sh "$ENV" cykruit-app "$TAG"
    /opt/cykruit-v2/deploy.sh "$ENV" admin-app "$TAG"
    /opt/cykruit-v2/deploy.sh "$ENV" cykruit-ui "$TAG"
    /opt/cykruit-v2/deploy.sh "$ENV" admin-ui "$TAG"
    ;;
  *)
    echo "Invalid option: $TARGET_OPTION" >&2
    exit 1
    ;;
esac

echo ""
echo "Done. Current status:"
cd /opt/cykruit-v2 && ENV="$ENV" docker compose ps
$