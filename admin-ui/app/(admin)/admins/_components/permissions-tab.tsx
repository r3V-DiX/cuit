'use client';

// admin-ui/app/(admin)/admins/_components/permissions-tab.tsx
// Read-only permission registry map.

import { useEffect, useState } from 'react';
import { api } from '@/lib';
import type { Permission } from '@/lib';
import { Table } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { ShieldAlert } from 'lucide-react';

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<Permission[]>('/api/admin/rbac/permissions');
        setPermissions(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    }
    loadPermissions();
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (loading) return <SkeletonTable rows={5} />;

  if (permissions.length === 0) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-6 w-6" />}
        title="No permissions found"
        description="Permission registry is empty."
      />
    );
  }

  return (
    <Table
      data={permissions}
      getRowKey={(p) => p.id}
      columns={[
        {
          key: 'module',
          header: 'Module',
          render: (p) => (
            <span className="inline-flex h-6 items-center rounded-lg bg-blue-50 px-2 font-mono text-xs font-bold uppercase tracking-wider text-blue-700">
              {p.module}
            </span>
          ),
        },
        {
          key: 'action',
          header: 'Action',
          render: (p) => <span className="font-mono text-sm text-slate-900">{p.action}</span>,
        },
        {
          key: 'description',
          header: 'Description',
          render: (p) => <span className="text-slate-600">{p.description}</span>,
        },
      ]}
    />
  );
}
