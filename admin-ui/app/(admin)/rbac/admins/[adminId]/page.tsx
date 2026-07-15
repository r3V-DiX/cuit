'use client';

// admin-ui/app/(admin)/rbac/admins/[adminId]/page.tsx
// One admin's resolved RBAC: role assignments (assign/revoke) and
// permission overrides (grant/deny), gated on rbac:manage.
import { useState, useEffect, useCallback, use } from 'react';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type {
  AdminRoleAssignment,
  AdminPermissionOverride,
  AdminSummary,
  RbacRole,
  Permission,
} from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { ArrowLeft, Plus, Trash2, Lock } from 'lucide-react';
import Link from 'next/link';

const inputCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';

interface AdminRbacData {
  roles: AdminRoleAssignment[];
  overrides: AdminPermissionOverride[];
}

export default function AdminRbacPage({ params }: { params: Promise<{ adminId: string }> }) {
  const { adminId } = use(params);
  const { has, user } = usePermissions();
  const { openModal } = useModal();
  const { toast } = useToast();

  const [admin, setAdmin] = useState<AdminSummary | null>(null);
  const [data, setData] = useState<AdminRbacData | null>(null);
  const [allRoles, setAllRoles] = useState<RbacRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Assign-role form state
  const [roleToAssign, setRoleToAssign] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [savingPermId, setSavingPermId] = useState<string | null>(null);

  const canManage = has(ACTIONS.RBAC.MANAGE);
  const isSelf = user?.id === adminId;
  const canEdit = canManage && !isSelf;
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadAdminRbac() {
      try {
        const [adminSummary, roles, overrides, rolesCatalog, permsCatalog] = await Promise.all([
          api.get<AdminSummary>(`/api/admin/rbac/admins/${adminId}`),
          api.get<AdminRoleAssignment[]>(`/api/admin/rbac/admins/${adminId}/roles`),
          api.get<AdminPermissionOverride[]>(
            `/api/admin/rbac/admins/${adminId}/permission-overrides`,
          ),
          api.get<RbacRole[]>('/api/admin/rbac/roles'),
          api.get<Permission[]>('/api/admin/rbac/permissions'),
        ]);
        setAdmin(adminSummary);
        setData({ roles, overrides });
        setAllRoles(rolesCatalog);
        setAllPermissions(permsCatalog);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin RBAC');
      } finally {
        setLoading(false);
      }
    }
    loadAdminRbac();
  }, [adminId, reloadKey]);

  async function performAssign() {
    setAssigning(true);
    try {
      await api.post('/api/admin/rbac/admin-roles', { adminId, roleId: roleToAssign });
      toast({ type: 'success', message: 'Role assigned.' });
      setRoleToAssign('');
      refresh();
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to assign role',
      });
    } finally {
      setAssigning(false);
    }
  }

  function handleAssignRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleToAssign) return;

    const currentRoleNames = (data?.roles ?? []).map((r) => r.role?.name ?? r.roleId);
    const newRoleName = allRoles.find((r) => r.id === roleToAssign)?.name ?? roleToAssign;

    if (currentRoleNames.length > 0) {
      openModal({
        title: 'Replace role?',
        description: `An admin holds exactly one role. Assigning "${newRoleName}" will replace the current role${
          currentRoleNames.length > 1 ? 's' : ''
        } (${currentRoleNames.join(', ')}).`,
        variant: 'danger',
        confirmLabel: 'Replace',
        onConfirm: performAssign,
      });
      return;
    }

    performAssign();
  }

  function handleRevokeRole(assignment: AdminRoleAssignment) {
    openModal({
      title: 'Revoke role?',
      description: `"${assignment.role?.name ?? assignment.roleId}" will be removed from this admin.`,
      variant: 'danger',
      confirmLabel: 'Revoke',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/rbac/admin-roles/${assignment.id}`);
          toast({ type: 'success', message: 'Role revoked.' });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to revoke role',
          });
        }
      },
    });
  }

  async function toggleOverride(perm: Permission) {
    const baseHas = basePermissionIds.has(perm.id);
    const existingOverride = overrideByPermissionId.get(perm.id);
    const currentlyChecked = existingOverride ? existingOverride.grant : baseHas;
    const newChecked = !currentlyChecked;

    setSavingPermId(perm.id);
    try {
      if (newChecked === baseHas) {
        if (existingOverride) {
          await api.del(`/api/admin/rbac/permission-overrides/${existingOverride.id}`);
        }
      } else {
        await api.post('/api/admin/rbac/permission-overrides', {
          adminId,
          permissionId: perm.id,
          grant: newChecked,
        });
      }
      toast({ type: 'success', message: 'Permission updated.' });
      refresh();
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update permission',
      });
    } finally {
      setSavingPermId(null);
    }
  }

  if (!loading && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const assignedRoleIds = new Set((data?.roles ?? []).map((r) => r.roleId));
  const assignableRoles = allRoles.filter((r) => r.isActive && !assignedRoleIds.has(r.id));

  const basePermissionIds = new Set(
    (data?.roles ?? []).flatMap((r) => (r.role?.permissions ?? []).map((rp) => rp.permission.id)),
  );
  const overrideByPermissionId = new Map(
    (data?.overrides ?? []).map((o) => [o.permissionId, o] as const),
  );
  const permissionModules = [...new Set(allPermissions.map((p) => p.module))].sort();

  return (
    <RequirePermission action={ACTIONS.RBAC.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/rbac"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {admin ? `${admin.firstName} ${admin.lastName}` : 'Admin Access'}
            </h2>
            {admin && <p className="text-sm text-slate-500">{admin.email}</p>}
          </div>
        </div>

        {loading || !data ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <div className="space-y-6">
            {canManage && isSelf && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <Lock className="h-4 w-4 shrink-0" />
                You cannot change your own role or permissions — ask another admin.
              </div>
            )}

            {/* Roles */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Assigned Roles</h3>
              {data.roles.length > 0 ? (
                <ul className="space-y-2">
                  {data.roles.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100"
                    >
                      <span>{r.role?.name ?? r.roleId}</span>
                      {canEdit && (
                        <button
                          onClick={() => handleRevokeRole(r)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Revoke role"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No roles assigned.</p>
              )}

              {canEdit && assignableRoles.length > 0 && (
                <form onSubmit={handleAssignRole} className="mt-4 flex gap-2.5">
                  <select
                    value={roleToAssign}
                    onChange={(e) => setRoleToAssign(e.target.value)}
                    className={`${inputCls} w-64`}
                  >
                    <option value="">Select a role to assign…</option>
                    {assignableRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!roleToAssign || assigning}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {assigning ? 'Assigning…' : 'Assign'}
                  </button>
                </form>
              )}
            </div>

            {/* Overrides */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Permission Overrides</h3>
                <p className="text-xs text-slate-500">
                  Checked = effective access. Toggling away from the role default creates an
                  override; toggling back removes it.
                </p>
              </div>
              <div className="space-y-4">
                {permissionModules.map((mod) => (
                  <div key={mod}>
                    <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {mod}
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {allPermissions
                        .filter((p) => p.module === mod)
                        .map((p) => {
                          const baseHas = basePermissionIds.has(p.id);
                          const override = overrideByPermissionId.get(p.id);
                          const checked = override ? override.grant : baseHas;
                          const overrideNote = override
                            ? override.grant
                              ? 'Override: granted'
                              : 'Override: denied'
                            : baseHas
                              ? 'Via assigned role'
                              : 'Not granted';
                          const title = p.description
                            ? `${p.description} — ${overrideNote}`
                            : overrideNote;
                          return (
                            <label
                              key={p.id}
                              className="flex items-center gap-1.5 text-sm text-slate-700"
                              title={title}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!canEdit || savingPermId === p.id}
                                onChange={() => toggleOverride(p)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-mono text-xs">
                                {p.action}
                                {override && (
                                  <span
                                    className={`ml-1 ${override.grant ? 'text-emerald-600' : 'text-red-600'}`}
                                  >
                                    •
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
