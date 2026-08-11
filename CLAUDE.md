# Agent Rules

## Interaction Protocol

- **YOU MUST** output a numbered plan before executing any task, and wait for
  a positive response before proceeding.
- **IMPORTANT: Never auto-continue after a plan.** Stop and wait.
- If a step is ambiguous, ask ONE clarifying question before planning.
- **IMPORTANT: Never assume or decide anything on my behalf** — implementation
  choice, library, naming, file structure, or anything not explicitly specified.
  If more than one reasonable option exists, stop and ask before proceeding,
  even mid-task.

## Planning Format

Every plan must list:

1. Files to create (with full paths)
2. Files to modify (with full paths)
3. Commands to run (install, build, migrate, etc.)
4. Schema changes (if any Prisma model is affected)
⚠ Flag any destructive step (DROP, DELETE, overwrite, rename column) explicitly.
Show scope at the top: "X files touched | migration needed: yes/no"

## Diagnosis Before Fix

- **YOU MUST NOT apply a fix before identifying the root cause.**
  For any bug or broken behavior, first state:
  1. What is actually happening (observed behavior)
  2. Why it is happening (root cause)
  3. What the correct, idiomatic fix is for this stack
  Only then propose a solution.
- Do not patch symptoms. If a workaround is the only option,
  flag it explicitly as a workaround and explain why the root
  cause cannot be addressed directly.
- Before fixing, check if the same issue could exist elsewhere
  in the codebase (same pattern, same anti-pattern). If yes,
  flag all affected locations in the plan.

## Session Memory

- Each repository maintains its own `docs/SESSION_MEMORY.md` at its root.
  Scope all entries to the repo currently being worked in — never share or
  merge memory across repos.
- If the file doesn't exist, create it on the first mistake or correction encountered.
- Every time a mistake is corrected during a session, log it immediately:
  - What was done wrong
  - What the correct approach is
  - Which files or patterns it applies to
- At the start of any task, read the current repo's `docs/SESSION_MEMORY.md`
  before planning. Apply every logged correction proactively — do not wait to be reminded.
- If the same mistake recurs after being logged, stop, acknowledge it,
  and re-read the memory file before continuing.

## After Execution

- Output a brief summary: what was created, what was modified, what was skipped.
- If a command needs to be run manually (migration, install), list it at the end
  under "Next steps:".
- Do not re-explain code you just wrote.
- Track mistakes flagged during this session. If corrected once, apply the fix
  everywhere it applies and do not repeat the same error in any subsequent step or file.
- After completing a task, maintain a context file at `docs/CONTEXT.md` at the
  root of the current repo. If it doesn't exist, create it. If it does, update it.
  Each repo owns its own `docs/CONTEXT.md` — never write context from one repo
  into another's file.
  This file tracks: project structure decisions, schema changes, key conventions
  adopted, and any non-obvious implementation choices made during sessions.
  It is your reference for future tasks — treat it as living documentation.
  Sections to maintain: Overview, Architecture, Schema Changes,
  Decisions & Rationale, Pending / Known Issues.

## Token Efficiency

- Only read files directly relevant to the task.
- Do not re-read a file already read in this session.
- Summarize large files — never dump full contents unless asked.
- Do not scan directories or list folder contents to find files.
  If you need a file, ask or trace it from an import.
- No boilerplate comments or verbose inline explanations in generated code.
- No filler phrases ("Sure!", "Great question", "Of course").

## Stack — NestJS + Prisma + PostgreSQL + Next.js (TypeScript)

- **IMPORTANT:** All code is fully typed. Never use `any`. Use `unknown` if type is truly unclear.
- Enable `strict: true` in tsconfig on both backend and frontend.
- Backend structure per feature: `module / controller / service / dto`
- Use DTOs with `class-validator` for all request bodies.
- Use `@nestjs/swagger` decorators on all controllers and DTOs.
- Controllers handle HTTP only. Services handle business logic only.
- Use Guards for auth, Interceptors for logging/transform, Pipes for validation.
- **IMPORTANT:** Prisma: always use `select` — never return raw Prisma objects to the client.
- Prisma: use `prisma.$transaction` for any multi-step writes.
- Next.js: App Router, Server Components by default.
  Add `"use client"` only when strictly necessary (event handlers, hooks).
- Use `next/image` for images, `next/link` for navigation.

## Naming Conventions

- Files: `kebab-case` for all files and folders.
- Classes / Interfaces / Types: `PascalCase`
- Variables / Functions / Methods: `camelCase`
- Constants / Env keys: `SCREAMING_SNAKE_CASE`
- DTOs: suffix with `Dto` (e.g. `CreateUserDto`)
- Prisma models: `PascalCase` singular (e.g. `User`, `BlogPost`)
- DB columns: `snake_case` via `@map` in schema
- NestJS modules: suffix with `Module` (e.g. `AuthModule`)

## Project Structure

- Always use a feature-based, industry-standard folder structure. Never flatten,
  scatter, or improvise directory layout.
- NestJS backend — each feature lives under `src/<feature>/` containing:
  `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `dto/`
- Shared backend code goes in `src/common/` (guards, interceptors, filters, decorators).
  Never inline shared logic inside a feature folder.
- Next.js frontend — follow App Router conventions: `app/<route>/` with co-located
  `page.tsx`, `layout.tsx`, and route-specific components inside the route folder.
- Shared frontend code goes in `lib/` (utils, hooks, api clients) or `components/`
  (reusable UI). Never scatter these inside route folders.
- If a new folder is introduced that deviates from this layout, flag it in the plan
  and justify it before proceeding.

## Environment Variables

- **IMPORTANT: Never hardcode secrets, URLs, or credentials in code.**
- Always use NestJS `ConfigService` to access env vars in the backend.
- All env vars must exist in `.env.example` with a placeholder value.
- If a new env var is needed, add it to the plan and list it under "Next steps:".

## Error Handling

- Backend: use NestJS built-in exceptions only
  (`NotFoundException`, `BadRequestException`, `ForbiddenException`, etc.).
- Never use raw `throw new Error()` in controllers or services.
- Use a global exception filter for unexpected errors — do not swallow them silently.
- Frontend: handle loading and error states explicitly. No silent catch blocks.
- Always log the original error before rethrowing or transforming it.

## Type & Build Checks

- After any code change, verify no TypeScript errors are introduced.
  Run: `npx tsc --noEmit` on the affected project.
- If a build or type error is found during planning or execution, stop and
  report it before proceeding — do not work around type errors with casts.
- Never use `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
- Ensure imports resolve correctly — no missing barrel exports or circular deps.
