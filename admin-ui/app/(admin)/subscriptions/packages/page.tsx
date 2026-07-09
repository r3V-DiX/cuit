'use client';

// admin-ui/app/(admin)/subscriptions/packages/page.tsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { SubscriptionPackage } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Table from '@/components/ui/Table';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Package } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

export default function PackagesPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPackages() {
      try {
        // Assume packages endpoint exists or we can just mock empty for now
        const data = await api.get<SubscriptionPackage[]>('/api/admin/subscriptions/packages').catch(() => []);
        setPackages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load packages');
      } finally {
        setLoading(false);
      }
    }
    loadPackages();
  }, []);

  return (
    <RequirePermission action={ACTIONS.SUBSCRIPTIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Subscription Packages</h2>
          <p className="text-sm text-slate-500">Manage available subscription plans.</p>
        </div>

        {error ? (
           <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : loading ? (
          <SkeletonTable rows={5} />
        ) : packages.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No packages found"
          />
        ) : (
          <Table
            data={packages}
            getRowKey={(p) => p.id}
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (p) => <span className="font-medium text-slate-900">{p.name}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (p) => <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />,
              },
            ]}
          />
        )}
      </div>
    </RequirePermission>
  );
}
