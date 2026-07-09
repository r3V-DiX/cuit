# Cykruit Monorepo Context

## Overview
This repository contains the Cykruit platform services (`cykruit-app`, `admin-app`, `admin-ui`, etc).

## Architecture

### Admin Identity & RBAC (Implemented July 2026)
The admin console (`admin-app` / `admin-ui`) operates on a fully separated architecture:
- **Identity**: Admin console staff log in as `Admin` models (from the `admins` table). The `User` model with `role=ADMIN` is reserved for a future employer-company-admin concept in the main app.
- **Authentication**: `admin-app` owns its own session logic, creating `AdminSession` rows. The admin console does not depend on the main auth-service.
- **RBAC**: The admin console uses a dedicated set of tables: `AdminPermission`, `AdminRbacRole`, `AdminRolePermission`, `AdminRoleAssignment`, and `AdminPermissionOverride`. The standard `Permission` / `RbacRole` / `UserRoleAssignment` tables are reserved for the main application and are untouched by the console.
- **Auditing**: Console mutations log to `AdminAuditLog` (`admin_audit_logs` table), fully separate from the main app's `AuditLog`.

## Known Issues / Deviations
- **No CSRF in Admin Console v1**: Accepted trade-off. The admin-ui proxy sets `SameSite=Lax` cookies via a same-origin API proxy.
- **Admin Rate Limiting**: Throttler module with `@LoginRateLimit` applied to `POST /admin/auth/login`. Lockout is not yet implemented (fast follow).
- **Admin Accounts are seed-only**: Currently admins must be created directly via SQL or `seed.js`.
