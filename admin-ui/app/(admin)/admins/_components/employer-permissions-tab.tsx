'use client';

// admin-ui/app/(admin)/admins/_components/employer-permissions-tab.tsx
// Editable matrix: which permissions each fixed EmployerMemberRole
// (OWNER/HIRING_MANAGER/RECRUITER/VIEWER) grants on the employer side.
// Roles are a fixed enum here — no role create/delete, only per-role grants.

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib';
import type { EmployerRbacMatrix, EmployerMemberRole } from '@/lib';
import { Table } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui';
import { ShieldAlert, Loader2, Save } from 'lucide-react';

const ROLE_LABELS: Record<EmployerMemberRole, string> = {
  OWNER: 'Owner',
  HIRING_MANAGER: 'Hiring Manager',
  RECRUITER: 'Recruiter',
  VIEWER: 'Viewer',
};

export default function EmployerPermissionsTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<EmployerRbacMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Per-role working set of granted permission ids, only populated once edited.
  const [pending, setPending] = useState<Partial<Record<EmployerMemberRole, Set<string>>>>({});
  const [savingRole, setSavingRole] = useState<EmployerMemberRole | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<EmployerRbacMatrix>('/api/admin/employer-rbac/permissions');
      setMatrix(res);
      setPending({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employer permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }
  if (loading) return <SkeletonTable rows={8} />;
  if (!matrix || matrix.permissions.length === 0) {
    return <EmptyState icon={<ShieldAlert className="h-6 w-6" />} title="No permissions found" description="Employer permission registry is empty." />;
  }

  function grantedSet(role: EmployerMemberRole): Set<string> {
    if (pending[role]) return pending[role]!;
    return new Set(matrix!.permissions.filter((p) => p.grantedRoles.includes(role)).map((p) => p.id));
  }

  function toggle(role: EmployerMemberRole, permissionId: string) {
    if (!canManage) return;
    const current = new Set(grantedSet(role));
    if (current.has(permissionId)) current.delete(permissionId);
    else current.add(permissionId);
    setPending((prev) => ({ ...prev, [role]: current }));
  }

  async function saveRole(role: EmployerMemberRole) {
    setSavingRole(role);
    try {
      const permissionIds = Array.from(grantedSet(role));
      const res = await api.patch<EmployerRbacMatrix>(`/api/admin/employer-rbac/roles/${role}`, { permissionIds });
      setMatrix(res);
      setPending((prev) => {
        const next = { ...prev };
        delete next[role];
        return next;
      });
      toast({ type: 'success', message: `${ROLE_LABELS[role]} permissions updated.` });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : `Failed to update ${ROLE_LABELS[role]}` });
    } finally {
      setSavingRole(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Changes take effect for new team members immediately; existing sessions pick them up within 5 minutes (permission cache TTL).
      </p>
      <Table
        data={matrix.permissions}
        getRowKey={(p) => p.id}
        columns={[
          {
            key: 'permission',
            header: 'Permission',
            render: (p) => (
              <div>
                <span className="font-mono text-sm text-slate-900">{p.module}:{p.action}</span>
                {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
              </div>
            ),
          },
          ...matrix.roles.map((role) => ({
            key: role,
            header: ROLE_LABELS[role],
            className: 'text-center',
            render: (p: EmployerRbacMatrix['permissions'][number]) => (
              <input
                type="checkbox"
                checked={grantedSet(role).has(p.id)}
                onChange={() => toggle(role, p.id)}
                disabled={!canManage}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              />
            ),
          })),
        ]}
      />
      {canManage && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {matrix.roles
            .filter((role) => pending[role])
            .map((role) => (
              <button
                key={role}
                onClick={() => saveRole(role)}
                disabled={savingRole === role}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {savingRole === role ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save {ROLE_LABELS[role]}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
