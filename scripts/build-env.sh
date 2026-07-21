#!/bin/bash
set -euo pipefail

ENV="$1"
BACKEND_OUT="/opt/cykruit-v2/.env.${ENV}"
ADMIN_OUT="/opt/cykruit-v2/.env.${ENV}.admin"

: > "$BACKEND_OUT"; chmod 600 "$BACKEND_OUT"
: > "$ADMIN_OUT"; chmod 600 "$ADMIN_OUT"

aws ssm get-parameters-by-path --region ap-south-1 \
  --path "/cykruit-v2/${ENV}/backend/" --recursive --with-decryption \
  --query "Parameters[].{Name:Name,Value:Value}" --output json \
| jq -r '.[] | "\(.Name | split("/") | last | ascii_upcase | gsub("-";"_"))=\(.Value)"' \
>> "$BACKEND_OUT"

aws ssm get-parameters-by-path --region ap-south-1 \
  --path "/cykruit-v2/${ENV}/admin-backend/" --recursive --with-decryption \
  --query "Parameters[].{Name:Name,Value:Value}" --output json \
| jq -r '.[] | "\(.Name | split("/") | last | ascii_upcase | gsub("-";"_"))=\(.Value)"' \
>> "$ADMIN_OUT"

for key in db-password jwt-secret redis-password resend-api-key; do
  val=$(aws secretsmanager get-secret-value --region ap-south-1 \
    --secret-id "/cykruit-v2/${ENV}/backend/${key}" --query SecretString --output text \
    | jq -r '.[keys[0]]')
  varname=$(echo "$key" | tr 'a-z-' 'A-Z_')
  echo "${varname}=${val}" >> "$BACKEND_OUT"
done

# DATABASE_URL isn't stored directly - assembled here from the pieces above
# (db-host/db-port from Parameter Store, db-password from Secrets Manager, master
# username is fixed at "postgres" for this RDS instance, database is "cykruit").
# Password is @uri-encoded since Secrets-Manager-generated passwords can contain
# characters (@, :, /) that would otherwise break the connection URL.
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
echo "DATABASE_URL=postgresql://postgres:${db_password_enc}@${db_host}:${db_port}/cykruit?schema=public" >> "$BACKEND_OUT"

for key in google-oauth razorpay aws-s3-credentials ai-vendor-keys; do
  aws secretsmanager get-secret-value --region ap-south-1 \
    --secret-id "/cykruit-v2/${ENV}/backend/${key}" --query SecretString --output text \
  | jq -r 'to_entries[] | "\(.key)=\(.value)"' \
  >> "$BACKEND_OUT"
done

# bedrock-credentials is optional (only needed if Bedrock/resume-parsing is actually
# wired up in this env, per deployment docs) - don't hard-fail the whole script if
# it's missing/deleted, unlike the required secrets in the loop above.
if bedrock_secret=$(aws secretsmanager get-secret-value --region ap-south-1 \
    --secret-id "/cykruit-v2/${ENV}/backend/bedrock-credentials" --query SecretString --output text 2>/dev/null); then
  echo "$bedrock_secret" | jq -r 'to_entries[] | "\(.key)=\(.value)"' >> "$BACKEND_OUT"
else
  echo "WARN: bedrock-credentials not found/accessible for ${ENV} - skipping (Bedrock features will be unavailable)" >&2
fi

admin_jwt=$(aws secretsmanager get-secret-value --region ap-south-1 \
  --secret-id "/cykruit-v2/${ENV}/admin-backend/jwt-secret" --query SecretString --output text \
  | jq -r '.[keys[0]]')
echo "JWT_SECRET=${admin_jwt}" >> "$ADMIN_OUT"

admin_resend=$(aws secretsmanager get-secret-value --region ap-south-1 \
  --secret-id "/cykruit-v2/${ENV}/admin-backend/resend-api-key" --query SecretString --output text \
  | jq -r '.[keys[0]]')
echo "RESEND_API_KEY=${admin_resend}" >> "$ADMIN_OUT"

grep -E "^(DATABASE_URL|REDIS_HOST|REDIS_PORT|REDIS_PASSWORD|EMAIL_FROM)=" "$BACKEND_OUT" >> "$ADMIN_OUT"

# Docker Compose's OWN variable interpolation (used directly in docker-compose.yml,
# e.g. redis's ${REDIS_PASSWORD}) is resolved from a .env file in the compose
# project directory - separate from env_file: (which only injects into containers).
# Keep it in sync here so no command ever needs a manual `export REDIS_PASSWORD=...`.
COMPOSE_ENV="/opt/cykruit-v2/.env"
: > "$COMPOSE_ENV"; chmod 600 "$COMPOSE_ENV"
echo "ENV=${ENV}" >> "$COMPOSE_ENV"
grep "^REDIS_PASSWORD=" "$BACKEND_OUT" >> "$COMPOSE_ENV"

echo "Wrote $(wc -l < "$BACKEND_OUT") lines to $BACKEND_OUT"
echo "Wrote $(wc -l < "$ADMIN_OUT") lines to $ADMIN_OUT"