# Cykruit — How to Run

## Folder Structure

```
Cykruit-new/
├── cykruit-app/       # NestJS monorepo — all microservices
├── admin-app/         # NestJS standalone — admin API
├── cykruit-ui/        # Next.js frontend
└── docker-compose.yml # Postgres + Redis + all services
```

---

## Prerequisites

- Node.js >= 20
- npm >= 10
- PostgreSQL running on `localhost:5432`
- Redis running on `localhost:6379`

Or skip manual setup and use Docker (see bottom).

---

## 1. First-time setup

### cykruit-app
```bash
cd cykruit-app
npm install
cp .env.example .env        # already has .env — skip if exists
npx prisma migrate dev      # runs migrations + seeds automatically
npx prisma generate         # regenerate Prisma client
```

### admin-app
```bash
cd admin-app
npm install
cp .env.example .env        # fill in values (copy DB/Redis from cykruit-app .env)
node_modules/.bin/prisma generate --schema=../cykruit-app/prisma/schema.prisma
```

### cykruit-ui
```bash
cd cykruit-ui
npm install
cp .env.local.example .env.local   # if exists
```

---

## 2. Run cykruit-app (microservices)

### All services at once (recommended for dev)
```bash
cd cykruit-app
npm run start:dev:all
```
Starts all 10 services concurrently with hot-reload:

| Service               | Port | Command                             |
|-----------------------|------|-------------------------------------|
| auth-service          | 4001 | `npm run start:auth:dev`            |
| user-settings-service | 4002 | `npm run start:settings:dev`        |
| seeker-profile-service| 4003 | `npm run start:seeker-profile:dev`  |
| employer-service      | 4004 | `npm run start:employer:dev`        |
| seeker-service        | 4005 | `npm run start:seeker:dev`          |
| public-service        | 4006 | `npm run start:public:dev`          |
| notification-service  | 4007 | `npm run start:notification:dev`    |
| subscription-service  | 4008 | `npm run start:subscription:dev`    |
| ai-service            | 3005 | `npm run start:ai:dev`              |
| gateway               | 5000 | `npm run start:gateway:dev`         |

### One service at a time
```bash
cd cykruit-app

npm run start:auth:dev
npm run start:settings:dev
npm run start:seeker-profile:dev
npm run start:employer:dev
npm run start:seeker:dev
npm run start:public:dev
npm run start:notification:dev
npm run start:subscription:dev
npm run start:ai:dev
npm run start:gateway:dev
```

---

## 3. Run admin-app

```bash
cd admin-app
npm run start:dev
```

Runs on port **4010**.

---

## 4. Run cykruit-ui (frontend)

```bash
cd cykruit-ui
npm run dev
```

Runs on port **3000**.

---

## 5. Gateway routes (single entry point)

Everything goes through `http://localhost:5000`:

| Route prefix       | Forwards to                           |
|--------------------|---------------------------------------|
| `/auth`            | auth-service :4001                    |
| `/settings`        | user-settings-service :4002           |
| `/seeker-profile`  | seeker-profile-service :4003          |
| `/employer`        | employer-service :4004                |
| `/seeker`          | seeker-service :4005                  |
| `/public`          | public-service :4006                  |
| `/notifications`   | notification-service :4007            |
| `/subscriptions`   | subscription-service :4008            |
| `/ws`              | notification-service :4007 (WebSocket)|
| `/gateway/health`  | health check (gateway itself)         |
| `/ai`              | ai-service :3005 — ⚠️ NOT YET WIRED into gateway (`SERVICES` map missing `ai` entry in `gateway/src/main.ts`) |

---

## 6. Run with Docker (infra only — recommended)

Start just Postgres + Redis via Docker, run services locally:

```bash
# Start infra
docker-compose up postgres redis -d

# Then run services locally as above
cd cykruit-app && npm run start:dev:all
cd admin-app && npm run start:dev
```

### Run everything in Docker
```bash
docker-compose up --build
```

> Note: Dockerfiles for individual services need to be created per-service before this works end-to-end. The docker-compose file is ready — just add a `Dockerfile` to each `apps/<service>/` folder.

---

## 7. Useful commands

```bash
# cykruit-app
cd cykruit-app

npx prisma studio              # visual DB browser at localhost:5555
npx prisma migrate dev         # apply schema changes + seed
npx prisma generate            # regenerate Prisma client after schema change
npm run lint                   # lint all apps + libs
npm run format                 # format all files

# admin-app
cd admin-app

node_modules/.bin/prisma generate --schema=../cykruit-app/prisma/schema.prisma
npm run typecheck              # type check without building
```

---

## 8. Environment files

| File | Description |
|------|-------------|
| `cykruit-app/.env` | Main env — DB, Redis, JWT, AWS, ports, inter-service URLs |
| `admin-app/.env` | Admin env — DB, Redis, JWT (separate secret), subscription service URL |
| `cykruit-ui/.env.local` | Frontend env — API base URL |

Copy from `.env.example` if `.env` doesn't exist.
