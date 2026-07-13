# Prisma Schema & Migration Guide (Team)

This is the team's operating guide for `cykruit-app/prisma/schema.prisma` and
`cykruit-app/prisma/migrations/`. Every rule below traces back to a real
incident in this repo's history — follow them and that class of incident
doesn't recur.

## Core rules

### 1. Migration files are append-only — never edit or delete a merged one
Once a migration folder under `prisma/migrations/` is merged to `main`, treat
it as immutable. `_prisma_migrations` in the database stores a checksum of
each file; editing a merged migration causes checksum mismatches for anyone
who already applied it. Deleting one (even "accidentally," as a side effect
of an unrelated commit) breaks `migrate deploy`/`migrate status` for the
whole team and can silently drop schema history.

To fix a mistake in an already-merged migration, write a **new** migration
that corrects it. Never touch the old file.

**Review rule:** any PR that modifies or removes an *existing* file under
`prisma/migrations/` (as opposed to adding a new migration folder) should be
treated as a hard stop — ask why before approving.

### 2. Never run `prisma db push` against the shared dev database
`db push` writes schema changes straight to the database with no migration
file. It's fine for quick local experiments on a throwaway database you'll
reset. It must never be the way a real change reaches the team — it leaves
no record, and someone else later has to reverse-engineer a "baseline"
migration from the live schema to reconcile history (this happened with the
Admin RBAC tables).

Anything meant to ship goes through `prisma migrate dev`, which generates
and commits an actual migration file.

### 3. Pull before you generate a migration
Migration folders are timestamp-named. Two people generating migrations
concurrently from a stale local schema is how conflicting/duplicate
migrations happen. Convention:

- `git pull origin main` immediately before running `prisma migrate dev`.
- If your branch has been open more than a day, re-pull and regenerate
  before merging rather than rebasing a stale migration file.

### 4. CI must run `migrate status` (or `migrate diff`) against a clean DB
Local `migrate status` checks only catch drift on your machine, after the
fact. A CI step that spins up a clean database, applies all migrations, and
compares against `schema.prisma` catches a broken or missing migration the
moment it's pushed — not days later when someone happens to run
`migrate deploy` locally and gets stuck.

### 5. Local Postgres runs via Docker Compose, not a native per-machine install
`docker-compose.yml`'s `postgres` service is pinned to
`pgvector/pgvector:pg18` — Postgres 18 with the `vector` extension
preinstalled. Standardizing on this removes "works on my machine" drift
(missing extensions, version mismatches). Start it with:

```bash
docker compose up -d postgres
```

Same host/port/user/db as before (`localhost:5432`, `postgres`/`cykruit_db`) —
no `.env` changes needed if you're using the values already in
`.env.example` (`POSTGRES_PASSWORD` must be set in your local `.env`).

If you still have a native Postgres service running locally, stop it first —
both will fight over port 5432.

### 6. A migration that needs a Postgres extension must say so, twice
If a migration does `CREATE EXTENSION IF NOT EXISTS ...` (like
`add_ai_schema` does for `vector`), that requirement belongs in:
1. The migration SQL itself (idempotent `CREATE EXTENSION IF NOT EXISTS`).
2. The PR description — so teammates know *before* pulling and hitting a
   failed `migrate deploy`, not after.

### 7. Back up before any migration *resolution* command
`migrate resolve`, `migrate reset`, and hand-editing `migration_lock.toml`
don't behave like normal migrations — they change bookkeeping without
necessarily running SQL, or they're destructive outright. Before any of
these, dump the target database:

```bash
pg_dump -h localhost -U postgres -d cykruit_db -F c -f backup.dump
```

Cheap insurance, and it's exactly what made it possible to safely restore
data during this repo's Postgres 18 migration.

## Standard workflows

### Making a schema change
1. `git pull origin main`
2. Edit `cykruit-app/prisma/schema.prisma`
3. `npx prisma migrate dev --name <descriptive_name>` (from `cykruit-app/`)
   — this generates the migration file, applies it locally, and regenerates
   the Prisma client.
4. Review the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`
   before committing — Prisma's diff isn't always exactly what you intended
   (especially for column drops/renames).
5. Commit the migration folder alongside the schema change and the PR that
   needs it. Never commit a schema change without its migration.

### Applying pending migrations (e.g. after pulling teammates' work)
```bash
cd cykruit-app
npx prisma migrate status   # see what's pending
npx prisma migrate deploy   # apply pending migrations, no prompts, no drift-reset
npx prisma generate         # refresh the client
```
Use `migrate deploy`, not `migrate dev`, when you're just catching up on
someone else's migrations — `migrate dev` is for authoring new ones and will
offer to reset on drift.

### Handling drift (`migrate dev` wants to reset)
Stop. A reset drops data. Drift means the live database doesn't match what
migration history says it should — usually from a `db push` (see rule 2)
or a migration that was applied by hand. Diagnose the actual difference
before doing anything:
```bash
npx prisma migrate diff --from-empty --to-url "$DATABASE_URL" --script
```
Compare that output against what's already in `prisma/migrations/` to see
what's missing, then write a real migration (or a `migrate resolve --applied`
bookkeeping fix if the DDL already exists live) — never let the CLI reset
a database with real data in it.

## Troubleshooting reference

| Symptom | Cause | Fix |
|---|---|---|
| `migrate dev` demands a reset | Drift between DB and migration history | See "Handling drift" above — never accept the reset on a database with real data |
| `migrate status` shows migrations "not yet applied" that you didn't expect | You're behind `main` | `git pull`, then `migrate deploy` |
| `migrate deploy` fails on `CREATE EXTENSION` | Required Postgres extension not installed | Check the migration's PR description / SQL comments for the extension it needs; install it or use Docker Compose's `pgvector/pgvector:pg18` image |
| Migration folder missing / `migrate status` reports fewer migrations than `_prisma_migrations` has recorded | A migration file was deleted from git history | `pg_dump` first, then reconstruct the file from git history (`git show <commit>~1:<path>`) or coordinate with whoever else may already be fixing it — don't let two people fix the same gap independently |
| `ts-node-dev`/build fails with `Cannot find module '@cykruit/...'` after a schema/lib change | A service's `tsconfig.build.json` overrides (not inherits) `paths` and is missing the new package | Add the missing path entry, matching a working service's `tsconfig.build.json` |
| Unrelated `migrate dev` run generates a `DROP INDEX "jobs_embedding_idx"` (or any ivfflat index) you didn't ask for | ivfflat indexes on `Unsupported("vector(...)")` columns are raw SQL in the migration file — they can't be declared in `schema.prisma`, so Prisma's diff engine doesn't know they should exist and drops them on every subsequent `migrate dev`. This will keep happening until Prisma has native vector-index support. | Before committing a generated migration, check its SQL for a `DROP INDEX` on any vector index. If present, delete that statement from the file, then (if already applied locally) manually re-run the matching `CREATE INDEX ... USING ivfflat (...)` and update that migration's checksum in `_prisma_migrations` (`sha256sum` the edited file, `UPDATE _prisma_migrations SET checksum = '<hash>' WHERE migration_name = '<name>'`) |
