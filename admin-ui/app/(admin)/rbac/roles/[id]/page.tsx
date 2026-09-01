'use client';

// admin-ui/app/(admin)/rbac/roles/[id]/page.tsx
// Role detail + management. Mirrors backend guardrails: system roles cannot be
// renamed or deactivated, and super_admin's permission set is locked.
import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS, SYSTEM_ROLE_NAMES, SUPER_ADMIN_ROLE } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { RbacRole, Permission } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { ArrowLeft, Shield, Pencil, Lock, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { has } = usePermissions();
  const { toast } = useToast();
  const { openModal } = useModal();
  const router = useRouter();

  const [role, setRole] = useState<RbacRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [savingRole, setSavingRole] = useState(false);

  // Permission matrix state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [permQuery, setPermQuery] = useState('');

  const canManage = has(ACTIONS.RBAC.MANAGE);
  const isSystemRole = role ? SYSTEM_ROLE_NAMES.includes(role.name) : false;
  const isSuperAdmin = role?.name === SUPER_ADMIN_ROLE;
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadRole() {
      try {
        const [data, perms] = await Promise.all([
          api.get<RbacRole>(`/api/admin/rbac/roles/${id}`),
          api.get<Permission[]>('/api/admin/rbac/permissions'),
        ]);
        setRole(data);
        setPermissions(perms);
        setName(data.name);
        setDescription(data.description ?? '');
        setIsActive(data.isActive);
        setSelectedIds((data.permissions ?? []).map((p) => p.permission.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load role');
      } finally {
        setLoading(false);
      }
    }
    loadRole();
  }, [id, reloadKey]);

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setSavingRole(true);
    try {
      await api.patch<RbacRole>(`/api/admin/rbac/roles/${id}`, {
        ...(isSystemRole ? {} : { name: name.trim() }),
        description: description.trim(),
        ...(isSystemRole ? {} : { isActive }),
      });
      toast({ type: 'success', message: 'Role updated.' });
      setEditing(false);
      refresh();
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update role',
      });
    } finally {
      setSavingRole(false);
    }
  }

  function togglePermission(permId: string) {
    setSelectedIds((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId],
    );
  }

  async function handleSavePermissions() {
    setSavingPerms(true);
    try {
      await api.patch(`/api/admin/rbac/roles/${id}/permissions`, {
        permissionIds: selectedIds,
      });
      toast({ type: 'success', message: 'Permissions updated.' });
      refresh();
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update permissions',
      });
    } finally {
      setSavingPerms(false);
    }
  }

  function handleDeleteRole() {
    if (!role) return;
    openModal({
      title: 'Delete role?',
      description: `"${role.name}" will be permanently deleted. This only succeeds if no admin currently holds this role.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/rbac/roles/${id}`);
          toast({ type: 'success', message: 'Role deleted.' });
          router.push('/rbac');
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to delete role',
          });
        }
      },
    });
  }

  if (!loading && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const assignedIds = new Set((role?.permissions ?? []).map((p) => p.permission.id));
  const permsDirty =
    selectedIds.length !== assignedIds.size || selectedIds.some((pid) => !assignedIds.has(pid));
  const canEditPerms = canManage && !isSuperAdmin;
  const roleAssignedPermissions = role?.permissions ?? [];

  const query = permQuery.trim().toLowerCase();
  const matchesQuery = (p: Permission) =>
    !query ||
    p.action.toLowerCase().includes(query) ||
    p.module.toLowerCase().includes(query) ||
    (p.description?.toLowerCase().includes(query) ?? false);

  const filteredPermissions = permissions.filter(matchesQuery);
  const modules = [...new Set(filteredPermissions.map((p) => p.module))];

  const filteredRoleAssignedPermissions = roleAssignedPermissions.filter((p) =>
    matchesQuery(p.permission),
  );
  const roleAssignedModules = [
    ...new Set(filteredRoleAssignedPermissions.map((p) => p.permission.module)),
  ].sort();

  return (
    <RequirePermission action={ACTIONS.RBAC.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admins"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Role Details
            </h2>
          </div>
        </div>

        {loading || !role ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              {editing ? (
                <form onSubmit={handleSaveRole} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Name</label>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSystemRole}
                        title={isSystemRole ? 'System roles cannot be renamed' : undefined}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Description</label>
                      <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <label
                    className="flex w-fit items-center gap-2 text-sm text-slate-700"
                    title={isSystemRole ? 'System roles cannot be deactivated' : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={isSystemRole}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Active
                  </label>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingRole}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingRole ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <Shield className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">{role.name}</h3>
                        {isSystemRole && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-500"
                            title="Seed-owned system role"
                          >
                            <Lock className="h-3 w-3" />
                            System
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{role.description}</p>
                      <div className="mt-2">
                        <StatusBadge status={role.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    )}
                    {canManage && !isSystemRole && (
                      <button
                        onClick={handleDeleteRole}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold text-slate-900">
                  {canEditPerms ? 'Permissions' : 'Assigned Permissions'}
                </h4>
                {isSuperAdmin && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Lock className="h-3.5 w-3.5" />
                    super_admin&apos;s permission set is locked
                  </span>
                )}
                {canEditPerms && permsDirty && (
                  <button
                    onClick={handleSavePermissions}
                    disabled={savingPerms}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingPerms ? 'Saving…' : 'Save permissions'}
                  </button>
                )}
              </div>

              <div className="relative mb-4 max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={permQuery}
                  onChange={(e) => setPermQuery(e.target.value)}
                  placeholder="Search permissions…"
                  className={`${inputCls} pl-9`}
                />
              </div>

              {canEditPerms ? (
                permissions.length > 0 && filteredPermissions.length === 0 ? (
                  <p className="text-sm text-slate-500">No permissions match your search.</p>
                ) : (
                  <div className="space-y-4">
                    {modules.map((mod) => (
                      <div key={mod}>
                        <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {mod}
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                          {filteredPermissions
                            .filter((p) => p.module === mod)
                            .map((p) => (
                              <label
                                key={p.id}
                                className="flex items-center gap-1.5 text-sm text-slate-700"
                                title={p.description}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(p.id)}
                                  onChange={() => togglePermission(p.id)}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="font-mono text-xs">{p.action}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : roleAssignedPermissions.length === 0 ? (
                <p className="text-sm text-slate-500">No permissions assigned.</p>
              ) : filteredRoleAssignedPermissions.length === 0 ? (
                <p className="text-sm text-slate-500">No permissions match your search.</p>
              ) : (
                <div className="space-y-4">
                  {roleAssignedModules.map((mod) => (
                    <div key={mod}>
                      <p className="mb-1.5 font-mono text-sm font-bold uppercase tracking-wider text-slate-400">
                        {mod}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {filteredRoleAssignedPermissions
                          .filter((p) => p.permission.module === mod)
                          .map((p) => (
                            <span
                              key={p.permission.id}
                              className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 font-mono text-xs text-blue-700 border border-blue-100"
                              title={p.permission.description}
                            >
                              {p.permission.action}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
