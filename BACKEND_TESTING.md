# Backend Services Testing Guide

This repo is a NestJS monorepo with three backend services. Each service runs on its own port and shares the same database/session model.

## Services

| Service | Script | Default URL | Main purpose |
| --- | --- | --- | --- |
| Auth Service | `npm run start:auth:dev` | `http://localhost:4001` | Register, login, sessions, password reset, OAuth, account lifecycle |
| User Settings Service | `npm run start:settings:dev` | `http://localhost:4002` | Seeker/employer settings, notification preferences, location preferences |
| Seeker Profile Service | `npm run start:seeker-profile:dev` | `http://localhost:4003` | Seeker profile, education, experience, skills, projects, resumes, certifications |

## Prerequisites

From the repo root:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

Make sure `.env` has local values for `DATABASE_URL`, Redis, ports, and `JWT_SECRET`.

Start services in separate terminals:

```bash
npm run start:auth:dev
npm run start:settings:dev
npm run start:seeker-profile:dev
```

## Auth Cookie Setup

Most settings/profile routes require a logged-in user. Use curl's cookie jar to login once and reuse cookies.

Set handy shell variables:

```bash
AUTH=http://localhost:4001
SETTINGS=http://localhost:4002
PROFILE=http://localhost:4003
COOKIE_JAR=cookies.txt
```

Quick protected-route check:

```bash
curl -i "$AUTH/auth/me"
```

Expected result before login: `401 Unauthorized`.

Register a test seeker:

```bash
curl -i -X POST "$AUTH/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "confirmPassword": "Test@1234",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+919999999999",
    "role": "SEEKER"
  }'
```

Login and save cookies:

```bash
curl -i -c "$COOKIE_JAR" -X POST "$AUTH/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "rememberMe": true
  }'
```

Check current user:

```bash
curl -i -b "$COOKIE_JAR" "$AUTH/auth/me"
```

If login fails because the account is not verified, either complete the email verification flow or mark the test user verified in the database for local testing.

## Auth Service

Base URL: `http://localhost:4001`

### Common Routes

| Method | Path | Auth required | Notes |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | Create seeker or employer account |
| `POST` | `/auth/login` | No | Sets `session_token` and `csrf_token` cookies |
| `GET` | `/auth/me` | Yes | Current user |
| `GET` | `/auth/ws-token` | Yes | Short-lived WebSocket JWT |
| `POST` | `/auth/logout` | Yes | Clears current session |
| `POST` | `/auth/logout-all` | Yes | Clears all user sessions |
| `PATCH` | `/auth/change-password` | Yes | Changes password and logs user out |
| `PATCH` | `/auth/deactivate` | Yes | Deactivates account |
| `DELETE` | `/auth/account` | Yes | Schedules/deletes account |
| `POST` | `/auth/forgot-password` | No | Sends reset email |
| `GET` | `/auth/verify-reset-token?token=...` | No | Checks reset token |
| `POST` | `/auth/reset-password` | No | Resets password |
| `POST` | `/auth/verify-email` | No | Verifies email token |
| `POST` | `/auth/resend-verification` | No | Sends verification email again |
| `GET` | `/auth/check-verification?email=...` | No | Checks verification status |
| `GET` | `/auth/google` | No | Starts Google OAuth |
| `GET` | `/auth/github` | No | Starts GitHub OAuth |
| `GET` | `/auth/sessions` | Yes | Lists sessions |
| `DELETE` | `/auth/sessions/:id` | Yes | Revoke one session |
| `DELETE` | `/auth/sessions` | Yes | Revoke all other sessions |
| `GET` | `/auth/audit-log` | Yes | User audit events |

### Useful Tests

Get WebSocket token:

```bash
curl -i -b "$COOKIE_JAR" "$AUTH/auth/ws-token"
```

List sessions:

```bash
curl -i -b "$COOKIE_JAR" "$AUTH/auth/sessions"
```

Mobile login:

```bash
curl -i -X POST "$AUTH/auth/mobile/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "deviceName": "Local Test Device",
    "platform": "android",
    "appVersion": "1.0.0"
  }'
```

Forgot password:

```bash
curl -i -X POST "$AUTH/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com" }'
```

## User Settings Service

Base URL: `http://localhost:4002`

This service uses the same auth cookie from the auth service.

### Seeker Settings Routes

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/settings` | Get seeker settings |
| `PATCH` | `/settings/general` | Profile/search preferences |
| `PATCH` | `/settings/notifications` | Notification preferences |
| `GET` | `/settings/locations` | List preferred locations |
| `POST` | `/settings/locations` | Add preferred location |
| `DELETE` | `/settings/locations/:id` | Remove preferred location |
| `PATCH` | `/settings/locations/reorder` | Reorder preferred locations |

### Employer Settings Routes

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/employer/settings` | Get employer settings |
| `PATCH` | `/employer/settings/general` | Employer profile visibility |
| `PATCH` | `/employer/settings/notifications` | Employer notification preferences |

### Useful Tests

Get seeker settings:

```bash
curl -i -b "$COOKIE_JAR" "$SETTINGS/settings"
```

Update seeker general settings:

```bash
curl -i -b "$COOKIE_JAR" -X PATCH "$SETTINGS/settings/general" \
  -H "Content-Type: application/json" \
  -d '{
    "profileVisibility": "PUBLIC",
    "jobSearchStatus": "ACTIVELY_LOOKING",
    "availableFrom": "2026-07-03T00:00:00.000Z",
    "preferredJobTypes": ["FULL_TIME", "INTERNSHIP"],
    "preferredWorkModes": ["REMOTE", "HYBRID"],
    "willingToRelocate": true
  }'
```

Update seeker notification settings:

```bash
curl -i -b "$COOKIE_JAR" -X PATCH "$SETTINGS/settings/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "enableInApp": true,
    "enableEmail": true,
    "jobAlert_inApp": true,
    "jobAlert_email": false,
    "jobAlert_frequency": "DAILY"
  }'
```

Add a preferred location:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$SETTINGS/settings/locations" \
  -H "Content-Type: application/json" \
  -d '{ "locationId": "00000000-0000-4000-8000-000000000000" }'
```

Use a real `locationId` from your database for this to succeed.

## Seeker Profile Service

Base URL: `http://localhost:4003`

This service uses the same auth cookie from the auth service.

### Route Inventory

| Area | Routes |
| --- | --- |
| Profile | `GET /profile`, `PATCH /profile/basic-info`, `PATCH /profile/summary`, `PATCH /profile/image`, `DELETE /profile/image`, `GET /profile/completion` |
| Education | `GET /education`, `GET /education/:id`, `POST /education`, `PATCH /education/:id`, `DELETE /education/:id`, `GET /education/institutes/search` |
| Experience | `GET /experiences`, `GET /experiences/:id`, `POST /experiences`, `PATCH /experiences/:id`, `DELETE /experiences/:id` |
| Projects | `GET /projects`, `GET /projects/:id`, `POST /projects`, `PATCH /projects/:id`, `DELETE /projects/:id` |
| Skills | `GET /skills`, `GET /skills/search`, `GET /skills/categories`, `GET /skills/:id`, `POST /skills`, `PATCH /skills/:id`, `DELETE /skills/:id` |
| Certifications | `GET /certifications`, `GET /certifications/search`, `GET /certifications/:id`, `POST /certifications`, `PATCH /certifications/:id`, `DELETE /certifications/:id`, `PATCH /certifications/:id/certificate`, `DELETE /certifications/:id/certificate` |
| Resumes | `GET /resumes`, `GET /resumes/:id`, `POST /resumes`, `PATCH /resumes/:id`, `DELETE /resumes/:id` |
| CTF Profiles | `GET /ctf-profiles`, `GET /ctf-profiles/:id`, `POST /ctf-profiles`, `PATCH /ctf-profiles/:id`, `DELETE /ctf-profiles/:id` |

### Useful Tests

Get profile:

```bash
curl -i -b "$COOKIE_JAR" "$PROFILE/profile"
```

Update basic info:

```bash
curl -i -b "$COOKIE_JAR" -X PATCH "$PROFILE/profile/basic-info" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "title": "Backend Developer",
    "location": {
      "city": "Bengaluru",
      "state": "Karnataka",
      "country": "India"
    },
    "linkedin": "https://www.linkedin.com/in/test-user",
    "github": "https://github.com/test-user",
    "portfolio": "https://example.com",
    "availability": "Immediate"
  }'
```

Update summary:

```bash
curl -i -b "$COOKIE_JAR" -X PATCH "$PROFILE/profile/summary" \
  -H "Content-Type: application/json" \
  -d '{ "summary": "Backend developer focused on NestJS, PostgreSQL, Redis, and secure APIs." }'
```

Check completion:

```bash
curl -i -b "$COOKIE_JAR" "$PROFILE/profile/completion"
```

Create education:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$PROFILE/education" \
  -H "Content-Type: application/json" \
  -d '{
    "degree": "B.Tech",
    "fieldOfStudy": "Computer Science",
    "instituteName": "Local Test University",
    "startDate": "2020",
    "endDate": "2024",
    "grade": "8.5 CGPA",
    "description": "Focused on backend engineering and security."
  }'
```

Create experience:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$PROFILE/experiences" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Backend Developer",
    "company": "Cykruit",
    "location": "Remote",
    "employmentType": "Full-time",
    "startDate": "2024-01",
    "endDate": "2026-06",
    "current": false,
    "description": "Built APIs and service integrations.",
    "tools": ["NestJS", "PostgreSQL", "Redis"],
    "achievements": ["Improved API reliability"]
  }'
```

Create project:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$PROFILE/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Auth API",
    "description": "A secure authentication API with sessions, CSRF protection, and audit logging.",
    "technologies": ["NestJS", "Prisma", "PostgreSQL"],
    "projectUrl": "https://example.com",
    "startDate": "2025-01",
    "current": true,
    "highlights": ["Cookie sessions", "Rate limits"]
  }'
```

Search skill catalog:

```bash
curl -i -b "$COOKIE_JAR" "$PROFILE/skills/search?q=node"
```

Add skill:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$PROFILE/skills" \
  -H "Content-Type: application/json" \
  -d '{
    "skillId": "replace-with-real-skill-id",
    "proficiency": "Intermediate",
    "yearsOfExperience": 2
  }'
```

Search certifications:

```bash
curl -i -b "$COOKIE_JAR" "$PROFILE/certifications/search?q=aws"
```

Add certification:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$PROFILE/certifications" \
  -H "Content-Type: application/json" \
  -d '{
    "certificationId": "replace-with-real-certification-id",
    "issueDate": "2025-01",
    "expiryDate": "2028-01",
    "credentialId": "ABC-123",
    "credentialUrl": "https://example.com/cert"
  }'
```

Create CTF profile:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$PROFILE/ctf-profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "Hack The Box",
    "username": "testuser",
    "profileUrl": "https://example.com/testuser",
    "rank": "Hacker",
    "points": 100
  }'
```

## Common Troubleshooting

### `401 Unauthorized`

Login again and make sure you pass cookies:

```bash
curl -i -c "$COOKIE_JAR" -X POST "$AUTH/auth/login" \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "password": "Test@1234", "rememberMe": true }'
```

Then call protected routes with:

```bash
curl -i -b "$COOKIE_JAR" "$AUTH/auth/me"
```

### Database errors

Check that Postgres is running and `DATABASE_URL` matches your local database. Then run:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Redis connection errors

Check that Redis is running on the values in `.env`:

```text
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Search/add routes need seeded IDs

Some routes require real IDs from seeded lookup tables:

- `locationId`
- `skillId`
- `certificationId`
- `instituteId`

Use the search endpoints first, then copy a real ID into the create request.

