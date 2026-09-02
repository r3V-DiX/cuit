'use client';

// admin-ui/app/(admin)/subscriptions/_components/employer-subscriptions-tab.tsx
// Filters/pagination use local state, not URL query params — this tab shares
// a route with PackagesTab/DiscountsTab, and FilterBar/PaginationBar's normal
// URL-param sync would collide across tabs on the same pathname.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib';
import type { EmployerSubscription, PaginatedResponse } from '@/lib';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { CreditCard, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { ExportButton } from '@/components/admin';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function EmployerSubscriptionsTab() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

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

  const hasFilters = !!q || !!status;
  const clearFilters = () => {
    setQ('');
    setStatus('');
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
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employer ID..."
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
        <ExportButton entity="subscriptions" />
      </div>

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
                render: (s) => (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.effectiveStatus ?? s.status} />
                    {s.cancelAtPeriodEnd && s.expiresAt && (
                      <span className="text-[10px] font-medium text-amber-600">
                        cancels {format(new Date(s.expiresAt), 'MMM d')}
                      </span>
                    )}
                  </div>
                ),
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
          <PaginationBar pagination={data.pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
