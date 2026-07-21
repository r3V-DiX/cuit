#!/bin/bash
set -euo pipefail

ENV="$1"        # staging | prod
TARGET="$2"     # cykruit-app | admin-app | cykruit-ui | admin-ui | migrate
TAG="$3"        # git sha

cd /opt/cykruit-v2
export ENV="$ENV"

# redis service's ${REDIS_PASSWORD} interpolation needs this in the shell -
# env_file only injects vars into containers, not into compose's own interpolation.
export REDIS_PASSWORD=$(grep '^REDIS_PASSWORD=' "/opt/cykruit-v2/.env.$ENV" | cut -d'=' -f2-)

# Permanent fix for repeated "no space left on device" mid-pull failures:# self-clean before every deploy rather than relying on a separate cron job alone.
docker system prune -af
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin 443370715886.dkr.ecr.ap-south-1.amazonaws.com

case "$TARGET" in
  migrate)
    docker run --rm --env-file "/opt/cykruit-v2/.env.$ENV" \
      443370715886.dkr.ecr.ap-south-1.amazonaws.com/cykruit-app:auth-service-$ENV-$TAG \
      npx prisma migrate deploy
    ;;
  cykruit-app)
    export CYKRUIT_APP_TAG="$TAG"
    docker compose pull ai-service auth-service user-settings-service seeker-profile-service employer-service seeker-service public-service notification-service subscription-service gateway
    docker compose up -d ai-service auth-service user-settings-service seeker-profile-service employer-service seeker-service public-service notification-service subscription-service gateway
    ;;
  admin-app)
    export ADMIN_APP_TAG="$TAG"
    docker compose pull admin-app && docker compose up -d admin-app
    ;;
  cykruit-ui)
    export CYKRUIT_UI_TAG="$TAG"
    docker compose pull cykruit-ui && docker compose up -d cykruit-ui
    ;;
  admin-ui)
    export ADMIN_UI_TAG="$TAG"
    docker compose pull admin-ui && docker compose up -d admin-ui
    ;;
  *)
    echo "Unknown target: $TARGET" >&2
    exit 1
    ;;
esac
$