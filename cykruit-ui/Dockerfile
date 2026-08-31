FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_TELEMETRY_DISABLED=1

# Server-side rewrite destinations (next.config.ts) are resolved at `next build`
# time into .next/routes-manifest.json — runtime env vars can't override them,
# so these must be build args, not just container env vars.
ARG AUTH_SERVICE_URL
ARG SETTINGS_SERVICE_URL
ARG PROFILE_SERVICE_URL
ARG EMPLOYER_SERVICE_URL
ARG SEEKER_SERVICE_URL
ARG PUBLIC_SERVICE_URL
ARG NOTIF_SERVICE_URL
ARG SUBS_SERVICE_URL
ARG AI_SERVICE_URL
ENV AUTH_SERVICE_URL=$AUTH_SERVICE_URL
ENV SETTINGS_SERVICE_URL=$SETTINGS_SERVICE_URL
ENV PROFILE_SERVICE_URL=$PROFILE_SERVICE_URL
ENV EMPLOYER_SERVICE_URL=$EMPLOYER_SERVICE_URL
ENV SEEKER_SERVICE_URL=$SEEKER_SERVICE_URL
ENV PUBLIC_SERVICE_URL=$PUBLIC_SERVICE_URL
ENV NOTIF_SERVICE_URL=$NOTIF_SERVICE_URL
ENV SUBS_SERVICE_URL=$SUBS_SERVICE_URL
ENV AI_SERVICE_URL=$AI_SERVICE_URL

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
