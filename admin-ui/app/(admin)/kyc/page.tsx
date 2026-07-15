'use client';

// admin-ui/app/(admin)/kyc/page.tsx
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { EmployerVerification, PaginatedResponse } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { FilterBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

function KycPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';

  const [data, setData] = useState<PaginatedResponse<EmployerVerification> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadKyc() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (status) params.set('status', status);

        const res = await api.get<PaginatedResponse<EmployerVerification>>(`/api/admin/kyc?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KYC requests');
      } finally {
        setLoading(false);
      }
    }
    loadKyc();
  }, [page, q, status]);

  const handleRowClick = (kyc: EmployerVerification) => {
    router.push(`/kyc/${kyc.id}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <RequirePermission action={ACTIONS.KYC.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">KYC Verification</h2>
          <p className="text-sm text-slate-500">Review and manage employer identity verification requests.</p>
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search company name..."
          filters={[
            {
              key: 'status',
              label: 'All Statuses',
              options: [
                { label: 'Pending', value: 'PENDING' },
                { label: 'Under Review', value: 'UNDER_REVIEW' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
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
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No KYC requests found"
            description="Adjust your search or filters to find what you're looking for."
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(k) => k.id}
              onRowClick={handleRowClick}
              columns={[
                {
                  key: 'company',
                  header: 'Company',
                  render: (k) => (
                    <div>
                      <p className="font-medium text-slate-900">{k.companyName}</p>
                      {k.employer?.userId && (
                        <p className="text-xs text-slate-500">Employer ID: {k.employer.userId}</p>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'industry',
                  header: 'Industry',
                  render: (k) => <span className="text-slate-600">{k.industry || '—'}</span>,
                },
                {
                  key: 'submittedAt',
                  header: 'Submitted',
                  render: (k) => (
                    <span className="text-sm text-slate-600">
                      {format(new Date(k.submittedAt), 'MMM d, yyyy')}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (k) => <StatusBadge status={k.status} />,
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

export default function KycPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <KycPageContent />
    </Suspense>
  );
}
