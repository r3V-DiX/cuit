'use client';

// admin-ui/app/(admin)/discounts/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { Discount, DiscountUsage, PaginatedResponse } from '@/lib';
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
import { Percent, Plus, Pencil, Ban, History } from 'lucide-react';
import DiscountForm from './_components/discount-form';

function formatValue(d: Discount) {
  return d.discountType === 'PERCENTAGE' ? `${d.value}%` : `₹${d.value}`;
}

function DiscountUsagesView({ discountId }: { discountId: string }) {
  const [data, setData] = useState<PaginatedResponse<DiscountUsage> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResponse<DiscountUsage>>(`/api/admin/discounts/${discountId}/usages?page=${page}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [discountId, page]);

  if (loading && !data) return <SkeletonTable rows={4} />;
  if (!data || data.items.length === 0) {
    return <EmptyState icon={<History className="h-6 w-6" />} title="No usages yet" description="This discount hasn't been applied to any orders." />;
  }

  return (
    <div className="space-y-3">
      <Table
        data={data.items}
        getRowKey={(u) => u.id}
        columns={[
          {
            key: 'employer',
            header: 'Employer',
            render: (u) => (
              <span className="text-slate-900">
                {u.employer?.companyName ?? u.employer?.user?.email ?? u.employerId}
              </span>
            ),
          },
          { key: 'saved', header: 'Saved', render: (u) => <span className="text-slate-500">₹{(u.amountSavedPaise / 100).toFixed(2)}</span> },
          { key: 'date', header: 'Date', render: (u) => <span className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</span> },
        ]}
      />
      <PaginationBar pagination={data.pagination} onPageChange={setPage} />
    </div>
  );
}

function DiscountsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const trigger = searchParams.get('trigger') ?? '';

  const [data, setData] = useState<PaginatedResponse<Discount> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.DISCOUNTS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadDiscounts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (status) params.set('status', status);
        if (trigger) params.set('trigger', trigger);

        const res = await api.get<PaginatedResponse<Discount>>(`/api/admin/discounts?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load discounts');
      } finally {
        setLoading(false);
      }
    }
    loadDiscounts();
  }, [page, q, status, trigger, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const openForm = (initial?: Discount) => {
    openModal({
      title: initial ? 'Edit Discount' : 'New Discount',
      size: 'lg',
      content: (
        <DiscountForm
          initial={initial}
          onSaved={() => {
            closeModal();
            toast({ type: 'success', message: initial ? 'Discount updated.' : 'Discount created.' });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const openUsages = (d: Discount) => {
    openModal({
      title: `Usages — ${d.name}`,
      size: 'lg',
      content: <DiscountUsagesView discountId={d.id} />,
    });
  };

  const handleDeactivate = (d: Discount) => {
    openModal({
      title: 'Deactivate discount?',
      description: `"${d.name}" will stop applying to new orders immediately. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Deactivate',
      onConfirm: async () => {
        try {
          await api.patch<Discount>(`/api/admin/discounts/${d.id}/deactivate`);
          toast({ type: 'success', message: 'Discount deactivated.' });
          refresh();
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to deactivate discount' });
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.DISCOUNTS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Discounts</h2>
            <p className="text-sm text-slate-500">Manage coupon codes and automatic subscription discounts.</p>
          </div>
          {canManage && (
            <button
              onClick={() => openForm()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Discount
            </button>
          )}
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search name or code..."
          filters={[
            {
              key: 'status',
              label: 'All Statuses',
              options: [
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' },
                { label: 'Expired', value: 'EXPIRED' },
              ],
            },
            {
              key: 'trigger',
              label: 'All Triggers',
              options: [
                { label: 'Coupon code', value: 'COUPON_CODE' },
                { label: 'Automatic', value: 'AUTOMATIC' },
              ],
            },
          ]}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : loading ? (
          <SkeletonTable rows={10} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<Percent className="h-6 w-6" />}
            title="No discounts found"
            description={canManage ? 'Add a discount to start offering deals.' : 'Adjust your filters to find what you are looking for.'}
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(d) => d.id}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (d) => (
                    <div>
                      <span className="text-slate-900">{d.name}</span>
                      {d.code && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">{d.code}</span>}
                    </div>
                  ),
                },
                { key: 'trigger', header: 'Trigger', render: (d) => <span className="text-slate-500">{d.trigger === 'COUPON_CODE' ? 'Coupon' : 'Automatic'}</span> },
                { key: 'value', header: 'Value', render: (d) => <span className="text-slate-900">{formatValue(d)}</span> },
                { key: 'applicability', header: 'Applies to', render: (d) => <span className="text-slate-500">{d.applicability === 'ALL_PACKAGES' ? 'All packages' : 'Specific'}</span> },
                { key: 'uses', header: 'Uses', render: (d) => <span className="text-slate-500">{d._count?.usages ?? 0}{d.maxTotalUses ? ` / ${d.maxTotalUses}` : ''}</span> },
                { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
                {
                  key: 'dates',
                  header: 'Validity',
                  render: (d) => (
                    <span className="text-xs text-slate-500">
                      {new Date(d.startsAt).toLocaleDateString()} – {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : 'no end'}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  render: (d) => (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openUsages(d)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        title="View usages"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => openForm(d)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {d.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleDeactivate(d)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Deactivate"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
            <PaginationBar pagination={data.pagination} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </RequirePermission>
  );
}

export default function DiscountsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <DiscountsPageContent />
    </Suspense>
  );
}
