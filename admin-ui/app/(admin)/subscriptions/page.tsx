'use client';

// admin-ui/app/(admin)/subscriptions/page.tsx
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { EmployerSubscription, PaginatedResponse } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Table from '@/components/ui/Table';
import PaginationBar from '@/components/ui/Pagination';
import FilterBar from '@/components/ui/FilterBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { CreditCard } from 'lucide-react';
import { format } from 'date-fns';

function SubscriptionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';

  const [data, setData] = useState<PaginatedResponse<EmployerSubscription> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscriptions() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (status) params.set('status', status);

        const res = await api.get<PaginatedResponse<EmployerSubscription>>(`/api/admin/subscriptions?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    }
    loadSubscriptions();
  }, [page, q, status]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <RequirePermission action={ACTIONS.SUBSCRIPTIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Subscriptions</h2>
          <p className="text-sm text-slate-500">Monitor employer subscription plans and usage.</p>
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search employer ID..."
          filters={[
            {
              key: 'status',
              label: 'All Statuses',
              options: [
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Expired', value: 'EXPIRED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ],
            },
          ]}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <SkeletonTable rows={10} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="No subscriptions found"
            description="Adjust your search or filters to find what you're looking for."
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(s) => s.id}
              columns={[
                {
                  key: 'employer',
                  header: 'Employer ID',
                  render: (s) => (
                    <div>
                      <p className="font-medium text-slate-900">{s.employer?.companyName || s.employerId}</p>
                    </div>
                  ),
                },
                {
                  key: 'package',
                  header: 'Package',
                  render: (s) => (
                    <span className="font-medium text-slate-700">
                      {s.package?.name || s.packageId}
                    </span>
                  ),
                },
                {
                  key: 'usage',
                  header: 'Jobs Usage',
                  render: (s) => (
                    <span className="text-sm text-slate-600">
                      {s.currentActiveJobs} / {s.package?.maxActiveJobs || '∞'}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (s) => <StatusBadge status={s.status} />,
                },
                {
                  key: 'period',
                  header: 'Period',
                  render: (s) => (
                    <div className="text-xs text-slate-500">
                      <p>Start: {format(new Date(s.startedAt), 'MMM d, yyyy')}</p>
                      {s.expiresAt && <p>End: {format(new Date(s.expiresAt), 'MMM d, yyyy')}</p>}
                    </div>
                  ),
                },
              ]}
            />
            <PaginationBar
              pagination={data.pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </RequirePermission>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <SubscriptionsPageContent />
    </Suspense>
  );
}
