'use client';

// admin-ui/app/(admin)/subscriptions/_components/discounts-tab.tsx
// Filters/pagination use local state, not URL query params — see the same
// note in employer-subscriptions-tab.tsx (shared route, would collide).

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { Discount, DiscountUsage, PaginatedResponse } from '@/lib';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Percent, Plus, Pencil, Ban, RotateCcw, Trash2, History, Search, X } from 'lucide-react';
import DiscountForm from './discount-form';

function formatValue(d: Discount) {
  return d.discountType === 'PERCENTAGE' ? `${d.value}%` : `₹${d.value}`;
}

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Expired', value: 'EXPIRED' },
];

const TRIGGER_OPTIONS = [
  { label: 'Coupon code', value: 'COUPON_CODE' },
  { label: 'Automatic', value: 'AUTOMATIC' },
];

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

export default function DiscountsTab() {
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [trigger, setTrigger] = useState('');

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

  const handleReactivate = (d: Discount) => {
    openModal({
      title: 'Reactivate discount?',
      description: `"${d.name}" will start applying to new orders again.`,
      confirmLabel: 'Reactivate',
      onConfirm: async () => {
        try {
          await api.patch<Discount>(`/api/admin/discounts/${d.id}/reactivate`);
          toast({ type: 'success', message: 'Discount reactivated.' });
          refresh();
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reactivate discount' });
        }
      },
    });
  };

  const handleDelete = (d: Discount) => {
    openModal({
      title: 'Delete discount?',
      description: `"${d.name}" will be permanently deleted. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/discounts/${d.id}`);
          toast({ type: 'success', message: 'Discount deleted.' });
          refresh();
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete discount' });
        }
      },
    });
  };

  const hasFilters = !!q || !!status || !!trigger;
  const clearFilters = () => {
    setQ('');
    setStatus('');
    setTrigger('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={`h-9 rounded-xl border px-3 font-mono text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              status ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={trigger}
            onChange={(e) => {
              setTrigger(e.target.value);
              setPage(1);
            }}
            className={`h-9 rounded-xl border px-3 font-mono text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              trigger ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <option value="">All Triggers</option>
            {TRIGGER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name or code..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-9 w-64 sm:w-80 rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-8 text-xs text-slate-700 placeholder-slate-400 transition-colors focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
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
                        {d.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleDeactivate(d)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Deactivate"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(d)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
                            title="Reactivate"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        {(d._count?.usages ?? 0) === 0 && (
                          <button
                            onClick={() => handleDelete(d)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />
          <PaginationBar pagination={data.pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
