// admin-app/src/admin/rbac/protected-admin.util.ts
// The RBAC_BOOTSTRAP_ADMIN_EMAIL account (see prisma/rbac-seed.ts) is the console's
// root admin. Its role assignment and active status can only be changed by itself —
// otherwise a newly-promoted super_admin could depose the admin that promoted them.

export function isProtectedRootAdmin(email: string, bootstrapEmail: string | undefined): boolean {
    return !!bootstrapEmail && email.toLowerCase() === bootstrapEmail.toLowerCase();
}
