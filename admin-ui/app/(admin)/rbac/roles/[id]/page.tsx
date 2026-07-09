'use client';

// admin-ui/app/(admin)/rbac/roles/[id]/page.tsx
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { RbacRole } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Skeleton from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [role, setRole] = useState<RbacRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRole() {
      try {
        const data = await api.get<RbacRole>(`/api/admin/rbac/roles/${id}`);
        setRole(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load role');
      } finally {
        setLoading(false);
      }
    }
    loadRole();
  }, [id]);

  if (!loading && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

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
              Role Details
            </h2>
          </div>
        </div>

        {loading || !role ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{role.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{role.description}</p>
                  <div className="mt-2">
                    <StatusBadge status={role.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Assigned Permissions</h4>
              {role.permissions && role.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((p) => (
                    <span key={p.permission.id} className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 font-mono text-xs text-blue-700 border border-blue-100">
                      {p.permission.action}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No permissions assigned.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
