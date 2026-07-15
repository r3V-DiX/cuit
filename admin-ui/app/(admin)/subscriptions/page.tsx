'use client';

// admin-ui/app/(admin)/subscriptions/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { EmployerSubscription, SubscriptionPackage, PaginatedResponse } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { FilterBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { CreditCard, Package, Plus } from 'lucide-react';
import { format } from 'date-fns';
import AssignSubscriptionForm from './_components/assign-subscription-form';

function SubscriptionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';

  const [data, setData] = useState<PaginatedResponse<EmployerSubscription> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.SUBSCRIPTIONS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

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
  }, [page, q, status, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const openAssign = async () => {
    try {
      const packages = await api.get<SubscriptionPackage[]>('/api/admin/subscriptions/packages');
      openModal({
        title: 'Assign Subscription',
        content: (
          <AssignSubscriptionForm
            packages={packages}
            onSaved={() => {
              closeModal();
              toast({ type: 'success', message: 'Subscription assigned.' });
              refresh();
            }}
            onCancel={closeModal}
          />
        ),
      });
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load packages',
      });
    }
  };

  return (
    <RequirePermission action={ACTIONS.SUBSCRIPTIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Subscriptions</h2>
            <p className="text-sm text-slate-500">Monitor employer subscription plans and usage.</p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/subscriptions/packages"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Package className="h-4 w-4" />
              Packages
            </Link>
            {canManage && (
              <button
                onClick={openAssign}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Assign Subscription
              </button>
            )}
          </div>
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
                  header: 'Employer',
                  render: (s) => (
                    <Link href={`/subscriptions/${s.id}`} className="group block">
                      <p className="font-medium text-slate-900 group-hover:text-blue-600">
                        {s.employer?.companyName || s.employerId}
                      </p>
                    </Link>
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
