# admin-app/Dockerfile
# Build context MUST be the repo root (admin-app depends on ../cykruit-app/libs
# and ../cykruit-app/prisma via TS path aliases — see tsconfig-paths-bootstrap.js)
#   docker build -f admin-app/Dockerfile .

FROM node:20-alpine AS builder

WORKDIR /app

COPY admin-app/package*.json ./admin-app/
COPY admin-app/tsconfig.json admin-app/tsconfig.build.json admin-app/tsconfig-paths-bootstrap.js admin-app/nest-cli.json ./admin-app/
COPY admin-app/src/ ./admin-app/src/

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
COPY --from=builder /app/admin-app/tsconfig-paths-bootstrap.js ./
COPY --from=builder /app/admin-app/dist ./dist
COPY --from=builder /app/cykruit-app/libs ../cykruit-app/libs
COPY --from=builder /app/cykruit-app/node_modules ../cykruit-app/node_modules

ENV NODE_ENV=production

EXPOSE 4010

CMD ["node", "-r", "./tsconfig-paths-bootstrap.js", "dist/main.js"]
