'use client';

// admin-ui/app/(admin)/rbac/admins/[adminId]/page.tsx
import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminRbacPage({ params }: { params: Promise<{ adminId: string }> }) {
  const { adminId } = use(params);
  const [data, setData] = useState<{ roles: any[]; permissions: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminRbac() {
      try {
        const res = await api.get<{ roles: any[]; permissions: any[] }>(`/api/admin/rbac/admins/${adminId}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin RBAC');
      } finally {
        setLoading(false);
      }
    }
    loadAdminRbac();
  }, [adminId]);

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
              Admin Access
            </h2>
          </div>
        </div>

        {loading || !data ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-6">
               <h3 className="font-semibold text-slate-900 mb-4">Assigned Roles</h3>
               {data.roles.length > 0 ? (
                 <ul className="space-y-2">
                   {data.roles.map(r => (
                     <li key={r.id} className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{r.role?.name || r.roleId}</li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-sm text-slate-500">No roles assigned.</p>
               )}
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
