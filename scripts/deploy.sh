#!/bin/bash

# ==========================================
# Cykruit v2 - Staging Deployment Script
# EC2 + AWS Secrets Manager + SSM Parameter Store
# Services: gateway, 8 microservices, ai-service, admin-app,
#           cykruit-ui, admin-ui, postgres (container), redis (container)
#
# Usage:
#   sudo bash cykruit-deploy.sh deploy              # full deploy
#   sudo bash cykruit-deploy.sh cleanup             # tear down containers/volumes/network
#   sudo bash cykruit-deploy.sh cleanup --dry-run    # preview cleanup, no changes
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step()  { echo -e "${BLUE}[STEP]${NC} $1"; }

MODE="${1:-deploy}"
DRY_RUN=false
if [ "$2" = "--dry-run" ]; then
    DRY_RUN=true
fi

echo "=========================================="
echo "   🚀 Cykruit v2 - Staging Deployment"
echo "=========================================="
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo bash cykruit-deploy.sh $MODE"
    exit 1
fi

# ==========================================
# Configuration — EDIT THESE BEFORE RUNNING
# ==========================================
AWS_REGION="ap-south-1"
ECR_REGISTRY="443370715886.dkr.ecr.ap-south-1.amazonaws.com"
ENVIRONMENT="staging"

APP_DOMAIN="cykruit-staging-app.rkavach.com"        # cykruit-ui
API_DOMAIN="cykruit-staging-api.rkavach.com"         # gateway
ADMIN_DOMAIN="cykruit-staging-admin.rkavach.com"     # admin-ui
ADMIN_API_DOMAIN="cykruit-staging-admin-api.rkavach.com"  # admin-app

DEPLOY_DIR="/opt/cykruit-v2"
SSM_PREFIX="/cykruit-v2/staging"

# Postgres/Redis are self-managed containers (staging traffic is low; RDS/ElastiCache
# not used here). If you decide to switch to RDS/ElastiCache later, update DB_HOST /
# REDIS_HOST_VAL below instead of "postgres" / "redis".
DB_HOST_VAL="postgres"
DB_NAME_VAL="cykruit_db"
DB_USER_VAL="postgres"
REDIS_HOST_VAL="redis"

# CSRF_SECRET is generated once and persisted to disk (regenerating it on every
# deploy would invalidate live sessions/tokens).
# MESSAGE_ENCRYPTION_KEY now lives in Secrets Manager (see STEP 4 below).
# ⚠️ Once real data has been encrypted with it, this key must NEVER be rotated
# or regenerated — doing so makes existing encrypted data permanently unreadable.

CSRF_SECRET_FILE="$DEPLOY_DIR/.csrf_secret"

# ==========================================
# CLEANUP MODE
# ==========================================
if [ "$MODE" = "cleanup" ]; then
    print_step "Cleanup mode $([ "$DRY_RUN" = true ] && echo '(DRY RUN)')"
    cd "$DEPLOY_DIR" 2>/dev/null || { print_warn "Deploy dir $DEPLOY_DIR not found, nothing to clean up."; exit 0; }

    echo ""
    print_warn "This will stop and remove all Cykruit containers on this host."
    echo "  Containers: gateway, auth-service, user-settings-service, seeker-profile-service,"
    echo "              employer-service, seeker-service, public-service, notification-service,"
    echo "              subscription-service, ai-service, admin-app, cykruit-ui, admin-ui,"
    echo "              postgres, redis"
    echo "  Network:    cykruit-network"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would run: docker compose down"
        print_info "[DRY RUN] Nothing removed. Re-run without --dry-run to actually clean up."
        exit 0
    fi

    read -p "Type 'yes' to stop and remove containers + network: " CONFIRM_1
    if [ "$CONFIRM_1" != "yes" ]; then
        print_info "Cleanup cancelled."
        exit 0
    fi

    docker compose down
    print_info "Containers and network removed ✓"

    echo ""
    print_warn "Volumes (postgres_data, redis_data) hold your staging DB and Redis data."
    print_warn "Removing them is IRREVERSIBLE — staging DB will be wiped."
    read -p "Type 'yes' to ALSO delete volumes: " CONFIRM_2
    if [ "$CONFIRM_2" = "yes" ]; then
        docker compose down -v
        print_info "Volumes removed ✓"
    else
        print_info "Volumes kept."
    fi

    echo ""
    read -p "Also prune dangling Docker images on this host? (yes/no): " CONFIRM_3
    if [ "$CONFIRM_3" = "yes" ]; then
        docker image prune -f
        print_info "Dangling images pruned ✓"
    fi

    print_info "Cleanup complete. .env files, nginx configs, SSM params, and Secrets Manager entries were left untouched."
    exit 0
fi

# ==========================================
# STEP 1: System Updates & Dependencies
# ==========================================
print_step "1/11: Installing system dependencies..."

print_info "Waiting for apt locks to release..."
while fuser /var/lib/apt/lists/lock /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    print_warn "apt is locked by another process, waiting 5s..."
    sleep 5
done

apt update && apt upgrade -y
apt install -y \
    curl wget git jq nginx snapd unzip \
    ca-certificates gnupg lsb-release

print_info "Installing certbot via snap..."
snap install core
snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

print_info "System dependencies installed ✓"

# ==========================================
# STEP 2: Install AWS CLI
# ==========================================
print_step "2/11: Installing AWS CLI..."

if ! command -v aws &> /dev/null; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    ./aws/install
    rm -rf awscliv2.zip aws/
    print_info "AWS CLI installed ✓"
else
    print_info "AWS CLI already installed ✓"
fi

print_info "Verifying IAM role..."
aws sts get-caller-identity --region "$AWS_REGION" > /dev/null 2>&1 || {
    print_error "IAM role not attached to EC2! Attach the deploy role and retry."
    exit 1
}
print_info "IAM role verified ✓"

# ==========================================
# STEP 3: Install Docker
# ==========================================
print_step "3/11: Installing Docker..."

if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    systemctl enable docker
    systemctl start docker
    print_info "Docker installed ✓"
else
    print_info "Docker already installed ✓"
fi

print_info "Logging in to Amazon ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
print_info "ECR login successful ✓"

# ==========================================
# STEP 4: Fetch Secrets from Secrets Manager
# ==========================================
print_step "4/11: Fetching secrets from AWS Secrets Manager..."

# Robust field getter: tries a list of candidate JSON keys (case as stored),
# falls back to treating the secret as a plain string if it isn't JSON.
# Exits loudly if nothing matches, rather than writing "null" into .env.
get_secret_field() {
    local secret_id="$1"
    shift
    local candidates=("$@")

    local raw
    raw=$(aws secretsmanager get-secret-value --secret-id "$secret_id" --region "$AWS_REGION" --query SecretString --output text 2>/dev/null) || {
        print_error "Could not fetch secret: $secret_id"
        exit 1
    }

    # Not JSON -> treat as a plain-string secret
    if ! echo "$raw" | jq -e . >/dev/null 2>&1; then
        echo "$raw"
        return 0
    fi

    local key val
    for key in "${candidates[@]}"; do
        val=$(echo "$raw" | jq -r --arg k "$key" '.[$k] // empty')
        if [ -n "$val" ]; then
            echo "$val"
            return 0
        fi
    done

    print_error "None of the expected keys (${candidates[*]}) found in secret: $secret_id"
    print_error "Open it with: aws secretsmanager get-secret-value --secret-id \"$secret_id\" --query SecretString --output text | jq ."
    print_error "...and add the real key name to the candidates list in get_secret_field() calls below."
    exit 1
}

# backend/*
DB_PASSWORD=$(get_secret_field "$SSM_PREFIX/backend/db-password" "password" "DB_PASSWORD")
BACKEND_JWT_SECRET=$(get_secret_field "$SSM_PREFIX/backend/jwt-secret" "secret" "JWT_SECRET" "jwt_secret")
REDIS_PASSWORD=$(get_secret_field "$SSM_PREFIX/backend/redis-password" "password" "REDIS_PASSWORD")
RESEND_API_KEY=$(get_secret_field "$SSM_PREFIX/backend/resend-api-key" "RESEND_API_KEY" "api_key")
AWS_S3_ACCESS_KEY_ID=$(get_secret_field "$SSM_PREFIX/backend/aws-s3-credentials" "AWS_ACCESS_KEY_ID" "access_key_id")
AWS_S3_SECRET_ACCESS_KEY=$(get_secret_field "$SSM_PREFIX/backend/aws-s3-credentials" "AWS_SECRET_ACCESS_KEY" "secret_access_key")
GOOGLE_CLIENT_SECRET=$(get_secret_field "$SSM_PREFIX/backend/google-oauth" "GOOGLE_CLIENT_SECRET" "client_secret")
RAZORPAY_KEY_ID=$(get_secret_field "$SSM_PREFIX/backend/razorpay" "RAZORPAY_KEY_ID" "key_id")
RAZORPAY_KEY_SECRET=$(get_secret_field "$SSM_PREFIX/backend/razorpay" "RAZORPAY_KEY_SECRET" "key_secret")
RAZORPAY_WEBHOOK_SECRET=$(get_secret_field "$SSM_PREFIX/backend/razorpay" "RAZORPAY_WEBHOOK_SECRET" "webhook_secret")

# backend/ai-vendor-keys — confirmed structure
AI_VENDOR_RAW=$(aws secretsmanager get-secret-value --secret-id "$SSM_PREFIX/backend/ai-vendor-keys" --region "$AWS_REGION" --query SecretString --output text)
GEMINI_API_KEY=$(echo "$AI_VENDOR_RAW" | jq -r '.GEMINI_API_KEY')
OPENROUTER_API_KEY=$(echo "$AI_VENDOR_RAW" | jq -r '.OPENROUTER_API_KEY')
LLAMA_CLOUD_API_KEY=$(echo "$AI_VENDOR_RAW" | jq -r '.LLAMA_CLOUD_API_KEY')
LANGCHAIN_API_KEY=$(echo "$AI_VENDOR_RAW" | jq -r '.LANGCHAIN_API_KEY')

# Bedrock: no dedicated IAM user found in Secrets Manager — reusing the S3 IAM
# user's keys by default. If a separate Bedrock IAM user exists, replace these two lines.
BEDROCK_AWS_ACCESS_KEY_ID="$AWS_S3_ACCESS_KEY_ID"
BEDROCK_AWS_SECRET_ACCESS_KEY="$AWS_S3_SECRET_ACCESS_KEY"

# admin-backend/*
ADMIN_JWT_SECRET=$(get_secret_field "$SSM_PREFIX/admin-backend/jwt-secret" "secret" "JWT_SECRET" "jwt_secret")
ADMIN_RESEND_API_KEY=$(get_secret_field "$SSM_PREFIX/admin-backend/resend-api-key" "RESEND_API_KEY" "api_key")

# message encryption key — DO NOT rotate/regenerate once real data is encrypted with it
CYKRUIT_MESSAGE_ENCRYPTION_KEY=$(get_secret_field "$SSM_PREFIX/backend/message-encryption-key" "MESSAGE_ENCRYPTION_KEY")

print_info "Secrets fetched ✓"

# ==========================================
# STEP 5: Fetch Parameters from SSM
# ==========================================
print_step "5/11: Fetching parameters from SSM Parameter Store..."

ssm() {
    aws ssm get-parameter --name "$1" --region "$AWS_REGION" --query Parameter.Value --output text
}

# backend/*
B_APP_URL=$(ssm "$SSM_PREFIX/backend/app-url")
B_API_URL=$(ssm "$SSM_PREFIX/backend/api-url")
B_ADMIN_URL=$(ssm "$SSM_PREFIX/backend/admin-url")
B_ADMIN_EMAIL=$(ssm "$SSM_PREFIX/backend/admin-email")
B_AUTH_PORT=$(ssm "$SSM_PREFIX/backend/auth-port")
B_SETTINGS_PORT=$(ssm "$SSM_PREFIX/backend/settings-port")
B_SEEKER_PROFILE_PORT=$(ssm "$SSM_PREFIX/backend/seeker-profile-port")
B_EMPLOYER_PORT=$(ssm "$SSM_PREFIX/backend/employer-port")
B_SEEKER_PORT=$(ssm "$SSM_PREFIX/backend/seeker-port")
B_PUBLIC_PORT=$(ssm "$SSM_PREFIX/backend/public-port")
B_NOTIFICATION_PORT=$(ssm "$SSM_PREFIX/backend/notification-port")
B_SUBSCRIPTION_PORT=$(ssm "$SSM_PREFIX/backend/subscription-port")
B_GATEWAY_PORT=$(ssm "$SSM_PREFIX/backend/gateway-port")
B_DB_PORT=$(ssm "$SSM_PREFIX/backend/db-port")
B_BCRYPT_ROUNDS=$(ssm "$SSM_PREFIX/backend/bcrypt-rounds")
B_TRUSTED_PROXY_COUNT=$(ssm "$SSM_PREFIX/backend/trusted-proxy-count")
B_COOKIE_SECURE=$(ssm "$SSM_PREFIX/backend/cookie-secure")
B_COOKIE_DOMAIN=$(ssm "$SSM_PREFIX/backend/cookie-domain")
B_CORS_ORIGIN=$(ssm "$SSM_PREFIX/backend/cors-origin")
B_LOG_LEVEL=$(ssm "$SSM_PREFIX/backend/log-level")
B_AWS_REGION=$(ssm "$SSM_PREFIX/backend/aws-region")
B_INCLUDE_META=$(ssm "$SSM_PREFIX/backend/include-meta-in-production")
B_INCLUDE_REQUEST_ID=$(ssm "$SSM_PREFIX/backend/include-request-id")
B_INCLUDE_TIMESTAMP=$(ssm "$SSM_PREFIX/backend/include-timestamp")
B_INCLUDE_PATH=$(ssm "$SSM_PREFIX/backend/include-path")
B_EMAIL_FROM=$(ssm "$SSM_PREFIX/backend/email-from")
B_GOOGLE_CLIENT_ID=$(ssm "$SSM_PREFIX/backend/google-client-id")
B_GOOGLE_REDIRECT_URI=$(ssm "$SSM_PREFIX/backend/google-redirect-uri")
B_REDIS_PORT=$(ssm "$SSM_PREFIX/backend/redis-port")
B_REDIS_DB=$(ssm "$SSM_PREFIX/backend/redis-db")
B_REDIS_THROTTLER_DB=$(ssm "$SSM_PREFIX/backend/redis-throttler-db")
B_AI_PROVIDER=$(ssm "$SSM_PREFIX/backend/ai-provider")
B_BEDROCK_AWS_REGION=$(ssm "$SSM_PREFIX/backend/bedrock-aws-region")
B_BEDROCK_MODEL_LARGE=$(ssm "$SSM_PREFIX/backend/bedrock-model-large")
B_BEDROCK_MODEL_SMALL=$(ssm "$SSM_PREFIX/backend/bedrock-model-small")
B_BEDROCK_EMBEDDING_MODEL=$(ssm "$SSM_PREFIX/backend/bedrock-embedding-model")
B_GEMINI_MODEL=$(ssm "$SSM_PREFIX/backend/gemini-model")
B_GEMINI_MAX_TOKENS=$(ssm "$SSM_PREFIX/backend/gemini-max-tokens")
B_GEMINI_TEMPERATURE=$(ssm "$SSM_PREFIX/backend/gemini-temperature")
B_OPENROUTER_MODEL_NAME=$(ssm "$SSM_PREFIX/backend/openrouter-model-name")
B_LANGCHAIN_PROJECT=$(ssm "$SSM_PREFIX/backend/langchain-project")
B_LANGCHAIN_TRACING_V2=$(ssm "$SSM_PREFIX/backend/langchain-tracing-v2")

# service URLs — NOT trusting whatever is stored in SSM here, since those values may
# still reference localhost/dev hosts. Inside the docker-compose network, services
# must resolve each other by container/service name, so these are built explicitly.
AUTH_SERVICE_URL="http://auth-service:${B_AUTH_PORT}"
SETTINGS_SERVICE_URL="http://user-settings-service:${B_SETTINGS_PORT}"
SEEKER_PROFILE_SERVICE_URL="http://seeker-profile-service:${B_SEEKER_PROFILE_PORT}"
EMPLOYER_SERVICE_URL="http://employer-service:${B_EMPLOYER_PORT}"
SEEKER_SERVICE_URL="http://seeker-service:${B_SEEKER_PORT}"
PUBLIC_SERVICE_URL="http://public-service:${B_PUBLIC_PORT}"
NOTIFICATION_SERVICE_URL="http://notification-service:${B_NOTIFICATION_PORT}"
SUBSCRIPTION_SERVICE_URL="http://subscription-service:${B_SUBSCRIPTION_PORT}"
AI_SERVICE_PORT=3005
AI_SERVICE_URL="http://ai-service:${AI_SERVICE_PORT}"

# S3 buckets
S3_SEEKER_PHOTOS=$(ssm "$SSM_PREFIX/backend/s3-seeker-photos")
S3_RESUMES=$(ssm "$SSM_PREFIX/backend/s3-resumes")
S3_COMPANY_LOGOS=$(ssm "$SSM_PREFIX/backend/s3-company-logos")
S3_KYC_DOCUMENTS=$(ssm "$SSM_PREFIX/backend/s3-kyc-documents")
S3_COMPANY_BANNER=$(ssm "$SSM_PREFIX/backend/s3-company-banner")
S3_CERTIFICATIONS=$(ssm "$SSM_PREFIX/backend/s3-jobseeker-certifications")
S3_COMPANY_MEDIA=$(ssm "$SSM_PREFIX/backend/s3-company-media")

# admin-backend/*
A_ADMIN_PORT=$(ssm "$SSM_PREFIX/admin-backend/admin-port")
A_ADMIN_APP_URL=$(ssm "$SSM_PREFIX/admin-backend/admin-app-url")
A_HOST=$(ssm "$SSM_PREFIX/admin-backend/host")
A_CORS_ORIGIN=$(ssm "$SSM_PREFIX/admin-backend/cors-origin")
A_REDIS_PORT=$(ssm "$SSM_PREFIX/admin-backend/redis-port")
A_REDIS_DB=$(ssm "$SSM_PREFIX/admin-backend/redis-db")
A_RBAC_BOOTSTRAP_ADMIN_EMAIL=$(ssm "$SSM_PREFIX/admin-backend/rbac-bootstrap-admin-email")

# Persist CSRF secret across redeploys instead of regenerating it every run
mkdir -p "$DEPLOY_DIR"
if [ -f "$CSRF_SECRET_FILE" ]; then
    CSRF_SECRET=$(cat "$CSRF_SECRET_FILE")
else
    CSRF_SECRET=$(openssl rand -hex 32)
    echo "$CSRF_SECRET" > "$CSRF_SECRET_FILE"
    chmod 600 "$CSRF_SECRET_FILE"
fi

print_info "All secrets and parameters fetched ✓"

# ==========================================
# STEP 6: Setup Production Directory
# ==========================================
print_step "6/11: Setting up deploy directory..."
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# ==========================================
# STEP 7: Create .env files (backend + admin-backend)
# ==========================================
print_step "7/11: Creating .env files..."

cat > backend.env << ENV_EOF
NODE_ENV=production
APP_URL=${B_APP_URL}
API_URL=${B_API_URL}
ADMIN_URL=${B_ADMIN_URL}
ADMIN_EMAIL=${B_ADMIN_EMAIL}

AUTH_PORT=${B_AUTH_PORT}
SETTINGS_PORT=${B_SETTINGS_PORT}
SEEKER_PROFILE_PORT=${B_SEEKER_PROFILE_PORT}
EMPLOYER_PORT=${B_EMPLOYER_PORT}
SEEKER_PORT=${B_SEEKER_PORT}
PUBLIC_PORT=${B_PUBLIC_PORT}
NOTIFICATION_PORT=${B_NOTIFICATION_PORT}
SUBSCRIPTION_PORT=${B_SUBSCRIPTION_PORT}
GATEWAY_PORT=${B_GATEWAY_PORT}
port=${AI_SERVICE_PORT}
PORT=${AI_SERVICE_PORT}

AUTH_SERVICE_URL=${AUTH_SERVICE_URL}
SETTINGS_SERVICE_URL=${SETTINGS_SERVICE_URL}
SEEKER_PROFILE_SERVICE_URL=${SEEKER_PROFILE_SERVICE_URL}
EMPLOYER_SERVICE_URL=${EMPLOYER_SERVICE_URL}
SEEKER_SERVICE_URL=${SEEKER_SERVICE_URL}
PUBLIC_SERVICE_URL=${PUBLIC_SERVICE_URL}
NOTIFICATION_SERVICE_URL=${NOTIFICATION_SERVICE_URL}
SUBSCRIPTION_SERVICE_URL=${SUBSCRIPTION_SERVICE_URL}
AI_SERVICE_URL=${AI_SERVICE_URL}

INCLUDE_META_IN_PRODUCTION=${B_INCLUDE_META}
INCLUDE_REQUEST_ID=${B_INCLUDE_REQUEST_ID}
INCLUDE_TIMESTAMP=${B_INCLUDE_TIMESTAMP}
INCLUDE_PATH=${B_INCLUDE_PATH}

COOKIE_SECURE=${B_COOKIE_SECURE}
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=${B_COOKIE_DOMAIN}

JWT_SECRET=${BACKEND_JWT_SECRET}
CSRF_SECRET=${CSRF_SECRET}
BCRYPT_ROUNDS=${B_BCRYPT_ROUNDS}

DATABASE_URL=postgresql://${DB_USER_VAL}:${DB_PASSWORD}@${DB_HOST_VAL}:${B_DB_PORT}/${DB_NAME_VAL}

REDIS_HOST=${REDIS_HOST_VAL}
REDIS_PORT=${B_REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=${B_REDIS_DB}
REDIS_THROTTLER_DB=${B_REDIS_THROTTLER_DB}

RESEND_API_KEY=${RESEND_API_KEY}
EMAIL_FROM=${B_EMAIL_FROM}

LOG_LEVEL=${B_LOG_LEVEL}

AWS_ACCESS_KEY_ID=${AWS_S3_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_S3_SECRET_ACCESS_KEY}
AWS_REGION=${B_AWS_REGION}
AWS_S3_BUCKET_SEEKER_PHOTOS=${S3_SEEKER_PHOTOS}
AWS_S3_BUCKET_RESUMES=${S3_RESUMES}
AWS_S3_BUCKET_COMPANY_LOGOS=${S3_COMPANY_LOGOS}
AWS_S3_BUCKET_KYC_DOCUMENTS=${S3_KYC_DOCUMENTS}
AWS_S3_BUCKET_COMPANY_BANNER=${S3_COMPANY_BANNER}
AWS_S3_BUCKET_CERTIFICATIONS=${S3_CERTIFICATIONS}
AWS_S3_BUCKET_COMPANY_MEDIA=${S3_COMPANY_MEDIA}

MESSAGE_ENCRYPTION_KEY=${CYKRUIT_MESSAGE_ENCRYPTION_KEY}

GOOGLE_CLIENT_ID=${B_GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_REDIRECT_URI=${B_GOOGLE_REDIRECT_URI}

AI_PROVIDER=${B_AI_PROVIDER}
GEMINI_API_KEY=${GEMINI_API_KEY}
GEMINI_MODEL=${B_GEMINI_MODEL}
GEMINI_MAX_TOKENS=${B_GEMINI_MAX_TOKENS}
GEMINI_TEMPERATURE=${B_GEMINI_TEMPERATURE}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
OPENROUTER_MODEL_NAME=${B_OPENROUTER_MODEL_NAME}
LLAMA_CLOUD_API_KEY=${LLAMA_CLOUD_API_KEY}
LANGCHAIN_API_KEY=${LANGCHAIN_API_KEY}
LANGCHAIN_PROJECT=${B_LANGCHAIN_PROJECT}
LANGCHAIN_TRACING_V2=${B_LANGCHAIN_TRACING_V2}
BEDROCK_AWS_REGION=${B_BEDROCK_AWS_REGION}
BEDROCK_AWS_ACCESS_KEY_ID=${BEDROCK_AWS_ACCESS_KEY_ID}
BEDROCK_AWS_SECRET_ACCESS_KEY=${BEDROCK_AWS_SECRET_ACCESS_KEY}
BEDROCK_MODEL_LARGE=${B_BEDROCK_MODEL_LARGE}
BEDROCK_MODEL_SMALL=${B_BEDROCK_MODEL_SMALL}
BEDROCK_EMBEDDING_MODEL=${B_BEDROCK_EMBEDDING_MODEL}

RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET}

TRUSTED_PROXY_COUNT=${B_TRUSTED_PROXY_COUNT}
CORS_ORIGIN=${B_CORS_ORIGIN}
ENV_EOF

chmod 600 backend.env
print_info "backend.env created ✓ (shared by gateway + all microservices + ai-service)"

cat > admin-backend.env << ENV_EOF
NODE_ENV=production
HOST=${A_HOST}
ADMIN_PORT=${A_ADMIN_PORT}
ADMIN_APP_URL=${A_ADMIN_APP_URL}
CORS_ORIGIN=${A_CORS_ORIGIN}

JWT_SECRET=${ADMIN_JWT_SECRET}
CSRF_SECRET=${CSRF_SECRET}

DATABASE_URL=postgresql://${DB_USER_VAL}:${DB_PASSWORD}@${DB_HOST_VAL}:${B_DB_PORT}/${DB_NAME_VAL}

REDIS_HOST=${REDIS_HOST_VAL}
REDIS_PORT=${A_REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=${A_REDIS_DB}

RESEND_API_KEY=${ADMIN_RESEND_API_KEY}
RBAC_BOOTSTRAP_ADMIN_EMAIL=${A_RBAC_BOOTSTRAP_ADMIN_EMAIL}

AWS_ACCESS_KEY_ID=${AWS_S3_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_S3_SECRET_ACCESS_KEY}
AWS_REGION=${B_AWS_REGION}
ENV_EOF

chmod 600 admin-backend.env
print_info "admin-backend.env created ✓"

# ==========================================
# STEP 8: Create Docker Compose
# ==========================================
print_step "8/11: Creating docker-compose.yml..."

cat > docker-compose.yml << COMPOSE_HEADER
services:
  postgres:
    image: pgvector/pgvector:pg18
    container_name: cykruit-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER_VAL}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME_VAL}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:${B_DB_PORT}:5432"
    networks:
      - cykruit-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER_VAL}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    container_name: cykruit-redis
    restart: unless-stopped
    command: redis-server --requirepass "${REDIS_PASSWORD}"
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:${B_REDIS_PORT}:6379"
    networks:
      - cykruit-network
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a \"${REDIS_PASSWORD}\" ping | grep -q PONG"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

COMPOSE_HEADER

# --- gateway (real /gateway/health) ---
cat >> docker-compose.yml << EOF
  gateway:
    image: ${ECR_REGISTRY}/cykruit-app:gateway-${ENVIRONMENT}-latest
    container_name: cykruit-gateway
    restart: unless-stopped
    env_file: backend.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "127.0.0.1:${B_GATEWAY_PORT}:${B_GATEWAY_PORT}"
    networks:
      - cykruit-network
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:${B_GATEWAY_PORT}/gateway/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

EOF

# --- 8 microservices + ai-service (real /health, loop to avoid repetition) ---
declare -A SERVICE_PORTS=(
    [auth-service]="$B_AUTH_PORT"
    [user-settings-service]="$B_SETTINGS_PORT"
    [seeker-profile-service]="$B_SEEKER_PROFILE_PORT"
    [employer-service]="$B_EMPLOYER_PORT"
    [seeker-service]="$B_SEEKER_PORT"
    [public-service]="$B_PUBLIC_PORT"
    [notification-service]="$B_NOTIFICATION_PORT"
    [subscription-service]="$B_SUBSCRIPTION_PORT"
    [ai-service]="$AI_SERVICE_PORT"
)

for svc in "${!SERVICE_PORTS[@]}"; do
    port="${SERVICE_PORTS[$svc]}"
    cat >> docker-compose.yml << EOF
  ${svc}:
    image: ${ECR_REGISTRY}/cykruit-app:${svc}-${ENVIRONMENT}-latest
    container_name: cykruit-${svc}
    restart: unless-stopped
    env_file: backend.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - cykruit-network
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:${port}/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

EOF
done

# --- admin-app (real /health, own image repo) ---
cat >> docker-compose.yml << EOF
  admin-app:
    image: ${ECR_REGISTRY}/cykruit-admin-app:${ENVIRONMENT}-latest
    container_name: cykruit-admin-app
    restart: unless-stopped
    env_file: admin-backend.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "127.0.0.1:${A_ADMIN_PORT}:${A_ADMIN_PORT}"
    networks:
      - cykruit-network
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:${A_ADMIN_PORT}/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

EOF

# --- frontends: pre-built images, NEXT_PUBLIC_* baked in at build time via CI,
#     no runtime env injection needed ---
cat >> docker-compose.yml << EOF
  cykruit-ui:
    image: ${ECR_REGISTRY}/cykruit-ui:${ENVIRONMENT}-latest
    container_name: cykruit-ui
    restart: unless-stopped
    depends_on:
      gateway:
        condition: service_healthy
    ports:
      - "127.0.0.1:3000:3000"
    networks:
      - cykruit-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  admin-ui:
    image: ${ECR_REGISTRY}/cykruit-admin-ui:${ENVIRONMENT}-latest
    container_name: cykruit-admin-ui
    restart: unless-stopped
    depends_on:
      admin-app:
        condition: service_healthy
    ports:
      - "127.0.0.1:3001:3000"
    networks:
      - cykruit-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  cykruit-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
EOF

print_info "docker-compose.yml created ✓ (15 services)"

# ==========================================
# STEP 9: Configure Nginx
# ==========================================
print_step "9/11: Configuring Nginx..."

rm -f /etc/nginx/sites-enabled/default

write_nginx_block() {
    local site_name="$1" domain="$2" port="$3"
    cat > "/etc/nginx/sites-available/${site_name}" << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }
}
NGINX_EOF
    ln -sf "/etc/nginx/sites-available/${site_name}" /etc/nginx/sites-enabled/
}

write_nginx_block "cykruit-app" "$APP_DOMAIN" "3000"
write_nginx_block "cykruit-api" "$API_DOMAIN" "$B_GATEWAY_PORT"
write_nginx_block "cykruit-admin" "$ADMIN_DOMAIN" "3001"
write_nginx_block "cykruit-admin-api" "$ADMIN_API_DOMAIN" "$A_ADMIN_PORT"

nginx -t && systemctl enable nginx && systemctl restart nginx
print_info "Nginx configured ✓ (4 server blocks)"

# ==========================================
# STEP 10: Pull Images, Migrate DB, Start Containers
# ==========================================
print_step "10/11: Pulling images and starting containers..."

docker compose pull

print_info "Starting postgres + redis first..."
docker compose up -d postgres redis

print_info "Waiting for postgres + redis to become healthy..."
for i in $(seq 1 30); do
    PG_STATUS=$(docker inspect --format='{{.State.Health.Status}}' cykruit-postgres 2>/dev/null || echo "starting")
    REDIS_STATUS=$(docker inspect --format='{{.State.Health.Status}}' cykruit-redis 2>/dev/null || echo "starting")
    if [ "$PG_STATUS" = "healthy" ] && [ "$REDIS_STATUS" = "healthy" ]; then
        print_info "postgres + redis healthy ✓"
        break
    fi
    sleep 5
done

print_info "Running Prisma migrations via auth-service image..."
docker compose run --rm auth-service npx prisma migrate deploy

print_info "Starting remaining services..."
docker compose up -d

print_info "Waiting 60s for services to stabilize..."
sleep 60

# ==========================================
# ⚠️ MANUAL FOLLOW-UP REQUIRED
# ==========================================
echo ""
print_warn "MANUAL STEP NEEDED: /cykruit-v2/staging/backend/redis-host and"
print_warn "/cykruit-v2/staging/admin-backend/redis-host are still set to a placeholder"
print_warn "value in SSM. Update them to 'redis' now that the container is running:"
echo "  aws ssm put-parameter --name \"$SSM_PREFIX/backend/redis-host\" --value \"redis\" --type String --overwrite --region $AWS_REGION"
echo "  aws ssm put-parameter --name \"$SSM_PREFIX/admin-backend/redis-host\" --value \"redis\" --type String --overwrite --region $AWS_REGION"
echo ""

# ==========================================
# STEP 11: SSL with Certbot (optional)
# ==========================================
print_warn "Make sure ALL 4 DNS records point to this server before setting up SSL!"
echo "  $APP_DOMAIN"
echo "  $API_DOMAIN"
echo "  $ADMIN_DOMAIN"
echo "  $ADMIN_API_DOMAIN"
echo ""
read -p "Set up SSL certificates now? (yes/no): " SSL_READY

if [ "$SSL_READY" = "yes" ]; then
    certbot --nginx \
        -d "$APP_DOMAIN" \
        -d "$API_DOMAIN" \
        -d "$ADMIN_DOMAIN" \
        -d "$ADMIN_API_DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email admin@rkavach.com \
        --redirect

    print_info "SSL certificates installed ✓"
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    print_info "SSL auto-renewal configured ✓"
else
    print_warn "Skipping SSL. Run manually later:"
    echo "  sudo certbot --nginx -d $APP_DOMAIN -d $API_DOMAIN -d $ADMIN_DOMAIN -d $ADMIN_API_DOMAIN"
fi

# ==========================================
# Final Status
# ==========================================
echo ""
echo "=========================================="
echo "   ✅ CYKRUIT STAGING DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
print_info "🌐 Your Application:"
echo "  App:            http://$APP_DOMAIN"
echo "  API (gateway):  http://$API_DOMAIN"
echo "  Admin:          http://$ADMIN_DOMAIN"
echo "  Admin API:      http://$ADMIN_API_DOMAIN"
echo ""
print_info "📦 Container Status:"
docker compose ps
echo ""
print_info "📋 Useful Commands:"
echo "  Logs (all):        cd $DEPLOY_DIR && docker compose logs -f"
echo "  Logs (one svc):     cd $DEPLOY_DIR && docker compose logs -f <service-name>"
echo "  Restart all:        cd $DEPLOY_DIR && docker compose restart"
echo "  Stop all:           cd $DEPLOY_DIR && docker compose down"
echo "  Cleanup (teardown): sudo bash cykruit-deploy.sh cleanup"
echo "  Nginx status:       sudo systemctl status nginx"
echo ""
echo "=========================================="