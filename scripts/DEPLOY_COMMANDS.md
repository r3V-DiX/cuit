# deploy.sh — Command Reference

Verified against both the repo copy (`scripts/deploy.sh`) and the live copy on
the prod box (`/opt/cykruit-v2/deploy.sh`) on 2026-09-18.

## ⚠ Version drift — prod box is behind

The prod box is running an **older** `deploy.sh` (last modified Jul 29,
predates commit `e8e403c`). It is missing:

- `dispatch` mode entirely (calling it from a CI runner will not work — the
  old script has no special case for `$2=dispatch` and will misparse the
  arguments).
- The `rbac-seed`, `policy-seed`, and `employer-rbac-seed` targets — these
  do not exist on the box yet, on-box or via dispatch.
- `deploy-menu.sh` does not exist on the box either (referenced by
  `docs/prod-ec2-runbook.md`, but not present at `/opt/cykruit-v2/`).

Everything below marked **(repo only — not yet on prod)** requires copying
the updated `scripts/deploy.sh` to `/opt/cykruit-v2/deploy.sh` on the box
first.

---

## Form 1 — Dispatch from a CI runner or local machine (repo only — not yet on prod)

Fires the command on the EC2 box for you via AWS SSM, and blocks until it
finishes (polls up to 7.5 min).

```bash
bash scripts/deploy.sh <env> dispatch <target> [tag]
```

- `<env>`: `staging` or `prod`
- `<target>`: any target from the list below
- `[tag]`: git short SHA, or omit for `latest`

Example:

```bash
bash scripts/deploy.sh prod dispatch employer-rbac-seed latest
```

Requires local AWS credentials with `ec2:DescribeInstances` and
`ssm:SendCommand` / `ssm:GetCommandInvocation` permissions. Resolves the
instance by tag `Name=cykruit-v2-app-server-<env>`.

---

## Form 2 — Direct, on the box (via SSM Session Manager, `sudo`)

```bash
sudo /opt/cykruit-v2/deploy.sh <env> <target> [tag]
```

Same targets/tag rules as Form 1, just run locally on the instance instead of
dispatched. `<env>` is actually auto-detected from which `.env.<env>` file
exists in `/opt/cykruit-v2/`, but is still required as `$1` for
CI-mode-compatibility.

## Form 3 — Interactive menu (on the box, `sudo`)

```bash
sudo /opt/cykruit-v2/deploy.sh
```

Prompts for a numbered option, then (for app/seed targets) auto-resolves the
latest ECR tag. Menu numbering **differs between prod's current script and
the repo version** — see the two tables below.

---

## Targets

| Target | What it does | On prod now? |
|---|---|---|
| `cykruit-app` | Pulls + restarts all 10 microservices (`ai-service`, `auth-service`, `user-settings-service`, `seeker-profile-service`, `employer-service`, `seeker-service`, `public-service`, `notification-service`, `subscription-service`, `gateway`), waits for `auth-service`+`gateway` healthy | ✅ |
| `admin-app` | Pulls + restarts admin-app, waits healthy | ✅ |
| `cykruit-ui` | Pulls + restarts the Next.js frontend, waits healthy | ✅ |
| `admin-ui` | Pulls + restarts the admin Next.js frontend, waits healthy | ✅ |
| `migrate` | `npx prisma migrate deploy`, run in a throwaway `auth-service` container against `$BACKEND_ENV` | ✅ |
| `seed` | `npx --yes tsx prisma/seed/index.ts` (skills, locations, packages, admins), throwaway `auth-service` container | ✅ |
| `rbac-seed` | Admin console RBAC catalog/system roles/bootstrap `super_admin`, throwaway `admin-app` container | ❌ repo only |
| `policy-seed` | Platform policy/rate-limit defaults, throwaway `admin-app` container | ❌ repo only |
| `employer-rbac-seed` | Employer team-role permission catalog + role defaults (`prisma/employer-rbac-seed.ts`), throwaway `auth-service` container | ❌ repo only |
| `all` | Repo version: `migrate` → `seed` → `rbac-seed` → `policy-seed` → `employer-rbac-seed` → all 4 apps. Prod's current version: `migrate` → `seed` → all 4 apps (no RBAC/policy seeds) | ✅ (reduced) |

`migrate`, `seed`, `rbac-seed`, `policy-seed`, `employer-rbac-seed` are all
idempotent and safe to re-run; the app/UI targets do `--force-recreate` and
briefly interrupt traffic to that service.

---

## Interactive menu numbering

**Repo version** (`scripts/deploy.sh`):

```
1) cykruit-app   5) migrate       9) employer-rbac-seed
2) admin-app     6) seed          10) All services
3) cykruit-ui    7) rbac-seed     11) Build env
4) admin-ui      8) policy-seed   12) Build env + Full deploy
```

**Prod's current version** (`/opt/cykruit-v2/deploy.sh`, no RBAC/policy seed options):

```
1) cykruit-app   5) migrate   9) Build env + Full deploy
2) admin-app     6) seed
3) cykruit-ui    7) All services
4) admin-ui      8) Build env
```

Options `10`/`7` ("All services") and `12`/`9` ("Build env + Full deploy")
prompt for a `yes`/`no` confirmation before running.

---

## Other on-box commands

```bash
sudo /opt/cykruit-v2/build-env.sh <env>     # same as menu option "Build env" — pulls SSM Parameter Store + Secrets Manager into .env files
```

Not related to `deploy.sh`'s own `do_build_env`/option 11(repo)/8(prod), which
does the same thing inline — `build-env.sh` is a separate standalone script
already on the box.

---

## Tag format

- A short git SHA (e.g. `4e38edd`) — falls back to `<service>-<env>-latest`
  per-service if that SHA tag isn't in ECR yet.
- `latest` — always pulls `<service>-<env>-latest` directly, no fallback logic.
- Omitted in the interactive menu — auto-resolved from the newest
  `auth-service-<env>-*` tag in ECR.
