'use client';

// admin-ui/app/(admin)/subscriptions/payments/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { PaymentOrder, PaginatedResponse } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { FilterBar } from '@/components/ui';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

function paise(n: number) {
  return '₹' + (n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function PaymentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const employerId = searchParams.get('employerId') ?? '';

  const [data, setData] = useState<PaginatedResponse<PaymentOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!has(ACTIONS.SUBSCRIPTIONS.VIEW)) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (employerId) params.set('employerId', employerId);

    api.get<PaginatedResponse<PaymentOrder>>(`/api/admin/subscriptions/payment-orders?${params}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load payment orders'))
      .finally(() => setLoading(false));
  }, [page, employerId, reloadKey, has]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <RequirePermission action={ACTIONS.SUBSCRIPTIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/subscriptions"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payment Orders</h2>
            <p className="text-sm text-slate-500">All Razorpay payment orders across employers.</p>
          </div>
        </div>

        <FilterBar
          searchKey="employerId"
          searchPlaceholder="Filter by employer ID..."
          filters={[]}
        />

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
                    <Link href={`/subscriptions?q=${o.employerId}`} className="text-sm font-medium text-slate-900 hover:text-blue-600">
                      {o.employer?.companyName ?? o.employerId}
                    </Link>
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
                  render: (o) => o.payment
                    ? <span className="font-mono text-xs text-emerald-700">{o.payment.razorpayPaymentId}</span>
                    : <span className="text-xs text-slate-300">—</span>,
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
            <PaginationBar pagination={data.pagination} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </RequirePermission>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <PaymentsContent />
    </Suspense>
  );
}
