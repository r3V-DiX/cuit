# apps/ai-service/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig-paths-bootstrap.js ./
COPY nest-cli.json ./

# Copy all libs and the target app
COPY libs/ ./libs/
COPY apps/ai-service/ ./apps/ai-service/
COPY prisma/ ./prisma/

RUN npm ci

RUN npx prisma generate

RUN npx nest build ai-service

# ── Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY tsconfig-paths-bootstrap.prod.js ./

ENV NODE_ENV=production

USER node

EXPOSE 3005

CMD ["node", "-r", "./tsconfig-paths-bootstrap.prod.js", "dist/apps/ai-service/apps/ai-service/src/main.js"]
