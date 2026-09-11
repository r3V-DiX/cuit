# admin-app/Dockerfile
# Build context MUST be the repo root (admin-app depends on ../cykruit-app/libs
# and ../cykruit-app/prisma via TS path aliases — see tsconfig-paths-bootstrap.js)
#   docker build -f admin-app/Dockerfile .

FROM node:20-alpine AS builder

WORKDIR /app

COPY admin-app/package*.json ./admin-app/
COPY admin-app/tsconfig.json admin-app/tsconfig.build.json admin-app/tsconfig-paths-bootstrap.js ./admin-app/
COPY admin-app/src/ ./admin-app/src/
COPY admin-app/prisma/ ./admin-app/prisma/

COPY cykruit-app/libs/ ./cykruit-app/libs/
COPY cykruit-app/prisma/ ./cykruit-app/prisma/
COPY cykruit-app/package*.json ./cykruit-app/

WORKDIR /app/admin-app
RUN npm ci

WORKDIR /app/cykruit-app
RUN npm ci

WORKDIR /app/admin-app
RUN npx prisma generate --schema=../cykruit-app/prisma/schema.prisma
RUN npm run build

# ── Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app/admin-app

COPY --from=builder /app/admin-app/package*.json ./
COPY --from=builder /app/admin-app/node_modules ./node_modules
COPY admin-app/tsconfig-paths-bootstrap.prod.js ./
COPY --from=builder /app/admin-app/dist ./dist
COPY --from=builder /app/cykruit-app/node_modules ../cykruit-app/node_modules

ENV NODE_ENV=production
# Compiled libs live under admin-app/dist, so Node's upward node_modules walk
# never reaches cykruit-app's deps (resend, ...) — NODE_PATH is the fallback.
ENV NODE_PATH=/app/cykruit-app/node_modules

USER node

EXPOSE 4010

# tsc's rootDir spans admin-app + cykruit-app/libs, so main.js lands at
# dist/admin-app/src/main.js and libs compile to dist/cykruit-app/libs/*.
# rbac-seed.js and policy-seed.js are NOT run here — they're idempotent but
# still schema/permission-catalog changes, run deliberately and individually
# via `scripts/deploy.sh <env> rbac-seed` / `policy-seed`, not on every
# container start/restart.
CMD ["node", "-r", "./tsconfig-paths-bootstrap.prod.js", "dist/admin-app/src/main.js"]
