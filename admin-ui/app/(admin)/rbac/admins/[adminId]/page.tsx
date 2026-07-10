'use client';

// admin-ui/app/(admin)/rbac/admins/[adminId]/page.tsx
// One admin's resolved RBAC: role assignments (assign/revoke) and
// permission overrides (grant/deny), gated on rbac:manage.
import { useState, useEffect, useCallback, use } from 'react';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import { usePermissions } from '@/lib/permissions-context';
import type {
  AdminRoleAssignment,
  AdminPermissionOverride,
  RbacRole,
  Permission,
} from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Skeleton from '@/components/ui/Skeleton';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

const inputCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';

interface AdminRbacData {
  roles: AdminRoleAssignment[];
  overrides: AdminPermissionOverride[];
}

export default function AdminRbacPage({ params }: { params: Promise<{ adminId: string }> }) {
  const { adminId } = use(params);
  const { has } = usePermissions();
  const { openModal } = useModal();
  const { toast } = useToast();

  const [data, setData] = useState<AdminRbacData | null>(null);
  const [allRoles, setAllRoles] = useState<RbacRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Assign-role / override form state
  const [roleToAssign, setRoleToAssign] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [overridePermId, setOverridePermId] = useState('');
  const [overrideGrant, setOverrideGrant] = useState<'grant' | 'deny'>('grant');
  const [overrideReason, setOverrideReason] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  const canManage = has(ACTIONS.RBAC.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadAdminRbac() {
      try {
        const [roles, overrides, rolesCatalog, permsCatalog] = await Promise.all([
          api.get<AdminRoleAssignment[]>(`/api/admin/rbac/admins/${adminId}/roles`),
          api.get<AdminPermissionOverride[]>(
            `/api/admin/rbac/admins/${adminId}/permission-overrides`,
          ),
          api.get<RbacRole[]>('/api/admin/rbac/roles'),
          api.get<Permission[]>('/api/admin/rbac/permissions'),
        ]);
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

  async function handleAssignRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleToAssign) return;
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

  async function handleAddOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!overridePermId) return;
    setSavingOverride(true);
    try {
      await api.post('/api/admin/rbac/permission-overrides', {
        adminId,
        permissionId: overridePermId,
        grant: overrideGrant === 'grant',
        ...(overrideReason.trim() ? { reason: overrideReason.trim() } : {}),
      });
      toast({ type: 'success', message: 'Permission override saved.' });
      setOverridePermId('');
      setOverrideReason('');
      refresh();
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save override',
      });
    } finally {
      setSavingOverride(false);
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
              Admin Access
            </h2>
          </div>
        </div>

        {loading || !data ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <div className="space-y-6">
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
                      {canManage && (
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

              {canManage && assignableRoles.length > 0 && (
                <form onSubmit={handleAssignRole} className="mt-4 flex gap-2.5">
                  <select
                    value={roleToAssign}
                    onChange={(e) => setRoleToAssign(e.target.value)}
                    className={`${inputCls} flex-1`}
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
              <h3 className="font-semibold text-slate-900 mb-4">Permission Overrides</h3>
              {data.overrides.length > 0 ? (
                <ul className="space-y-2">
                  {data.overrides.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100"
                    >
                      <div>
                        <span className="font-mono text-xs">
                          {o.permission ? `${o.permission.module}:${o.permission.action}` : o.permissionId}
                        </span>
                        {o.reason && (
                          <p className="mt-0.5 text-xs text-slate-400">{o.reason}</p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                          o.grant ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {o.grant ? 'GRANTED' : 'DENIED'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No permission overrides.</p>
              )}

              {canManage && (
                <form onSubmit={handleAddOverride} className="mt-4 space-y-2.5">
                  <div className="flex gap-2.5">
                    <select
                      value={overridePermId}
                      onChange={(e) => setOverridePermId(e.target.value)}
                      className={`${inputCls} flex-1`}
                    >
                      <option value="">Select a permission…</option>
                      {allPermissions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.module}:{p.action}
                        </option>
                      ))}
                    </select>
                    <select
                      value={overrideGrant}
                      onChange={(e) => setOverrideGrant(e.target.value as 'grant' | 'deny')}
                      className={inputCls}
                    >
                      <option value="grant">Grant</option>
                      <option value="deny">Deny</option>
                    </select>
                  </div>
                  <div className="flex gap-2.5">
                    <input
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className={`${inputCls} flex-1`}
                      placeholder="Reason (optional)"
                    />
                    <button
                      type="submit"
                      disabled={!overridePermId || savingOverride}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                      {savingOverride ? 'Saving…' : 'Add override'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
