'use client';

// admin-ui/app/(admin)/reports/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { ContentReport, PaginatedResponse } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { FilterBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { Button } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { Flag, Check, X } from 'lucide-react';

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

const REVIEWED_STATUSES = new Set(['RESOLVED_REMOVED', 'RESOLVED_DISMISSED']);

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const status = searchParams.get('status') ?? '';
  const contentType = searchParams.get('contentType') ?? '';

  const [data, setData] = useState<PaginatedResponse<ContentReport> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (status) params.set('status', status);
      if (contentType) params.set('contentType', contentType);

      const res = await api.get<PaginatedResponse<ContentReport>>(
        `/api/admin/reports?${params.toString()}`,
      );
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content reports');
    } finally {
      setLoading(false);
    }
  }, [page, status, contentType, reloadKey]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const runAction = (report: ContentReport, action: 'resolve' | 'dismiss') => {
    const isResolve = action === 'resolve';
    openModal({
      title: isResolve ? 'Resolve Report' : 'Dismiss Report',
      description: isResolve
        ? `Mark this report as resolved and treat the flagged content as removed?`
        : `Dismiss this report as a false positive?`,
      variant: isResolve ? 'danger' : 'default',
      confirmLabel: isResolve ? 'Resolve' : 'Dismiss',
      onConfirm: async () => {
        setActioningId(report.id);
        try {
          await api.patch(`/api/admin/reports/${report.id}/${action}`);
          toast({ type: 'success', message: `Report ${isResolve ? 'resolved' : 'dismissed'}.` });
          setReloadKey((k) => k + 1);
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : `Failed to ${action} report`,
          });
        } finally {
          setActioningId(null);
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.REPORTS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Content Reports</h2>
          <p className="text-sm text-slate-500">
            Review flagged jobs, profiles, and messages reported by users.
          </p>
        </div>

        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'All Statuses',
              options: [
                { label: 'Pending', value: 'PENDING' },
                { label: 'Under Review', value: 'UNDER_REVIEW' },
                { label: 'Resolved', value: 'RESOLVED_REMOVED' },
                { label: 'Dismissed', value: 'RESOLVED_DISMISSED' },
              ],
            },
            {
              key: 'contentType',
              label: 'All Content Types',
              options: [
                { label: 'Job', value: 'JOB' },
                { label: 'Employer Profile', value: 'EMPLOYER_PROFILE' },
                { label: 'Seeker Profile', value: 'SEEKER_PROFILE' },
                { label: 'Message', value: 'MESSAGE' },
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
            icon={<Flag className="h-6 w-6" />}
            title="No content reports found"
            description="Adjust your filters to find what you are looking for."
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(r) => r.id}
              columns={[
                {
                  key: 'reporter',
                  header: 'Reporter',
                  render: (r) => (
                    <div>
                      <p className="font-medium text-slate-900">
                        {r.reporter ? `${r.reporter.firstName} ${r.reporter.lastName}` : 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{r.reporter?.email}</p>
                    </div>
                  ),
                },
                {
                  key: 'content',
                  header: 'Content',
                  render: (r) => (
                    <div>
                      <p className="font-medium text-slate-900">{r.contentType}</p>
                      <p className="font-mono text-xs text-slate-500">{r.contentId}</p>
                    </div>
                  ),
                },
                {
                  key: 'reason',
                  header: 'Reason',
                  render: (r) => <span className="text-slate-600">{r.reason}</span>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => <StatusBadge status={r.status} />,
                },
                {
                  key: 'date',
                  header: 'Date',
                  render: (r) => <span className="text-slate-600">{formatDate(r.createdAt)}</span>,
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  render: (r) =>
                    REVIEWED_STATUSES.has(r.status) ? null : (
                      <RequirePermission action={ACTIONS.REPORTS.MANAGE}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => runAction(r, 'dismiss')}
                            loading={actioningId === r.id}
                            icon={<X className="h-4 w-4" />}
                          >
                            Dismiss
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => runAction(r, 'resolve')}
                            loading={actioningId === r.id}
                            icon={<Check className="h-4 w-4" />}
                          >
                            Resolve
                          </Button>
                        </div>
                      </RequirePermission>
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

export default function ReportsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <ReportsPageContent />
    </Suspense>
  );
}
