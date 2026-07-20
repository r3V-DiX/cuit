# apps/seeker-profile-service/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig-paths-bootstrap.js ./
COPY nest-cli.json ./

# Copy all libs and the target app
COPY libs/ ./libs/
COPY apps/seeker-profile-service/ ./apps/seeker-profile-service/
COPY prisma/ ./prisma/

RUN npm ci

RUN npx prisma generate

RUN npx nest build seeker-profile-service

# ── Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig-paths-bootstrap.js ./

ENV NODE_ENV=production

USER node

EXPOSE 4003

CMD ["node", "-r", "./tsconfig-paths-bootstrap.js", "dist/apps/seeker-profile-service/apps/seeker-profile-service/src/main.js"]
