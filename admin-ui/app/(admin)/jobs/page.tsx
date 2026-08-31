'use client';

// admin-ui/app/(admin)/jobs/page.tsx
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { Job, PaginatedResponse } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { FilterBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { ExportButton } from '@/components/admin';

function JobsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';

  const [data, setData] = useState<PaginatedResponse<Job> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (status) params.set('status', status);

        const res = await api.get<PaginatedResponse<Job>>(`/api/admin/jobs?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [page, q, status]);

  const handleRowClick = (job: Job) => {
    router.push(`/jobs/${job.id}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <RequirePermission action={ACTIONS.JOBS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Job Moderation</h2>
            <p className="text-sm text-slate-500">Review, approve, and manage job postings.</p>
          </div>
          <div className="flex gap-2.5">
            <ExportButton entity="jobs" />
            <ExportButton entity="applications" />
          </div>
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search job title or company..."
          filters={[
            {
              key: 'status',
              label: 'All Statuses',
              options: [
                { label: 'Pending', value: 'PENDING' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Closed', value: 'CLOSED' },
                { label: 'Expired', value: 'EXPIRED' },
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
            icon={<Briefcase className="h-6 w-6" />}
            title="No jobs found"
            description="Adjust your search or filters to find what you're looking for."
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(j) => j.id}
              onRowClick={handleRowClick}
              columns={[
                {
                  key: 'job',
                  header: 'Job',
                  render: (j) => (
                    <div>
                      <p className="font-medium text-slate-900">{j.jobTitle}</p>
                      <p className="text-xs text-slate-500">
                        {j.employer?.companyName || j.employerId}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'type',
                  header: 'Type & Mode',
                  render: (j) => {
                    const formatEnum = (str?: string) =>
                      str ? str.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';
                    return (
                      <span className="text-slate-600 text-xs font-medium">
                        {formatEnum(j.jobType)} {j.workMode ? `• ${formatEnum(j.workMode)}` : ''}
                      </span>
                    );
                  },
                },
                {
                  key: 'location',
                  header: 'Location',
                  render: (j) => (
                    <span className="text-slate-600 text-xs">
                      {j.location?.displayName || j.location?.city ? `${j.location.city}${j.location.country ? `, ${j.location.country}` : ''}` : 'Remote / Unspecified'}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (j) => <StatusBadge status={j.status} />,
                },
                {
                  key: 'createdAt',
                  header: 'Created',
                  render: (j) => (
                    <span className="text-sm text-slate-600">
                      {format(new Date(j.createdAt), 'MMM d, yyyy')}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Action',
                  className: 'text-right',
                  render: (j) => (
                    <div className="flex justify-end">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors group-hover:border-blue-300 group-hover:bg-blue-50">
                        {j.status === 'PENDING' ? 'Review →' : 'View →'}
                      </span>
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

export default function JobsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <JobsPageContent />
    </Suspense>
  );
}
