'use client';

// admin-ui/app/(admin)/subscriptions/_components/payment-history-tab.tsx
// Filters/pagination use local state, not URL query params — see the same
// note in employer-subscriptions-tab.tsx (shared route, would collide).

import { useState, useEffect } from 'react';
import { api } from '@/lib';
import type { PaymentOrder, PaginatedResponse } from '@/lib';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { CreditCard, Search, X } from 'lucide-react';
import { format } from 'date-fns';

function paise(n: number) {
  return '₹' + (n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

interface PaymentHistoryTabProps {
  /** Seeds the employer filter once on mount (e.g. deep-linked from a subscription's detail page). */
  initialEmployerId?: string;
}

export default function PaymentHistoryTab({ initialEmployerId }: PaymentHistoryTabProps) {
  const [page, setPage] = useState(1);
  const [employerId, setEmployerId] = useState(initialEmployerId ?? '');

  const [data, setData] = useState<PaginatedResponse<PaymentOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (employerId) params.set('employerId', employerId);

    api
      .get<PaginatedResponse<PaymentOrder>>(`/api/admin/subscriptions/payment-orders?${params}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load payment orders'))
      .finally(() => setLoading(false));
  }, [page, employerId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by employer ID..."
            value={employerId}
            onChange={(e) => {
              setEmployerId(e.target.value);
              setPage(1);
            }}
            className="h-9 w-64 sm:w-80 rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-8 text-xs text-slate-700 placeholder-slate-400 transition-colors focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300"
          />
        </div>
        {employerId && (
          <button
            onClick={() => {
              setEmployerId('');
              setPage(1);
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <SkeletonTable rows={10} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-6 w-6" />}
          title="No payment orders found"
          description="No Razorpay orders have been created yet."
        />
      ) : (
        <div className="space-y-4">
          <Table
            data={data.items}
            getRowKey={(o) => o.id}
            columns={[
              {
                key: 'employer',
                header: 'Employer',
                render: (o) => (
                  <span className="text-sm font-medium text-slate-900">
                    {o.employer?.companyName ?? o.employerId}
                  </span>
                ),
              },
              {
                key: 'order',
                header: 'Razorpay Order',
                render: (o) => <span className="font-mono text-xs text-slate-600">{o.razorpayOrderId}</span>,
              },
              {
                key: 'package',
                header: 'Package',
                render: (o) => (
                  <div className="text-xs text-slate-700">
                    <p className="font-medium">{o.package?.name ?? o.packageId}</p>
                    <p className="font-mono text-slate-400">{o.billingCycle}</p>
                  </div>
                ),
              },
              {
                key: 'amount',
                header: 'Amount (incl. GST)',
                render: (o) => (
                  <div className="font-mono text-xs">
                    <p className="font-semibold text-slate-900">{paise(o.totalAmountPaise)}</p>
                    <p className="text-slate-400">GST {paise(o.gstAmountPaise)}</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (o) => <StatusBadge status={o.status} />,
              },
              {
                key: 'payment',
                header: 'Payment ID',
                render: (o) =>
                  o.payment ? (
                    <span className="font-mono text-xs text-emerald-700">{o.payment.razorpayPaymentId}</span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  ),
              },
              {
                key: 'date',
                header: 'Date',
                render: (o) => (
                  <span className="text-xs text-slate-500">
                    {format(new Date(o.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
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
