# admin-ui/Dockerfile
# Build context: ./admin-ui (self-contained, no cross-folder imports)
#   docker build -f admin-ui/Dockerfile ./admin-ui

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# ── Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./

ENV NODE_ENV=production

USER node

EXPOSE 3100

CMD ["npm", "run", "start"]
