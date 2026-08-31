'use client';

// admin-ui/app/(admin)/applications/page.tsx
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { ApplicationSummary, PaginatedResponse } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { FilterBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

function ApplicationsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';

  const [data, setData] = useState<PaginatedResponse<ApplicationSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplications() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (status) params.set('status', status);

        const res = await api.get<PaginatedResponse<ApplicationSummary>>(
          `/api/admin/applications?${params.toString()}`,
        );
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, [page, q, status]);

  const handleRowClick = (application: ApplicationSummary) => {
    router.push(`/applications/${application.id}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <RequirePermission action={ACTIONS.APPLICATIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Job Applications</h2>
          <p className="text-sm text-slate-500">All applications submitted across every job posting.</p>
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search applicants, jobs, or employers..."
          filters={[
            {
              key: 'status',
              label: 'All Statuses',
              options: [
                { label: 'Applied', value: 'APPLIED' },
                { label: 'Under Review', value: 'UNDER_REVIEW' },
                { label: 'Shortlisted', value: 'SHORTLISTED' },
                { label: 'Rejected', value: 'REJECTED' },
                { label: 'Withdrawn', value: 'WITHDRAWN' },
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
            icon={<ClipboardList className="h-6 w-6" />}
            title="No applications found"
            description={status || q ? "Adjust your search or filters to find what you're looking for." : "No job applications have been submitted across the platform yet."}
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(a) => a.id}
              onRowClick={handleRowClick}
              columns={[
                {
                  key: 'seeker',
                  header: 'Seeker',
                  render: (a) => (
                    <div>
                      <p className="font-medium text-slate-900">
                        {a.jobSeeker ? `${a.jobSeeker.firstName} ${a.jobSeeker.lastName}` : '—'}
                      </p>
                      <p className="text-xs text-slate-500">{a.jobSeeker?.email}</p>
                    </div>
                  ),
                },
                {
                  key: 'job',
                  header: 'Job',
                  render: (a) => (
                    <div>
                      <p className="text-slate-900 font-medium">{a.job?.jobTitle ?? '—'}</p>
                      <p className="text-xs text-slate-500">{a.job?.employer?.companyName}</p>
                    </div>
                  ),
                },
                {
                  key: 'aiScore',
                  header: 'AI Score',
                  render: (a) => <span className="text-slate-600 font-mono text-xs">{a.aiScore !== null && a.aiScore !== undefined ? `${a.aiScore}%` : '—'}</span>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (a) => <StatusBadge status={a.status} />,
                },
                {
                  key: 'appliedAt',
                  header: 'Applied',
                  render: (a) => (
                    <span className="text-sm text-slate-600">
                      {format(new Date(a.appliedAt), 'MMM d, yyyy')}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Action',
                  className: 'text-right',
                  render: (a) => (
                    <div className="flex justify-end">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors group-hover:border-blue-300 group-hover:bg-blue-50">
                        View Details →
                      </span>
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

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <ApplicationsPageContent />
    </Suspense>
  );
}
