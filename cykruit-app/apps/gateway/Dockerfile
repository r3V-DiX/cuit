FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig-paths-bootstrap.js ./
RUN npm ci --ignore-scripts
COPY apps/gateway apps/gateway
RUN npx tsc -p apps/gateway/tsconfig.build.json

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist/apps/gateway dist/apps/gateway
ENV NODE_ENV=production
USER node
EXPOSE 5000
CMD ["node", "dist/apps/gateway/apps/gateway/src/main.js"]
