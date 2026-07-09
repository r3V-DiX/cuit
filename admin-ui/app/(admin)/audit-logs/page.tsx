'use client';

// admin-ui/app/(admin)/audit-logs/page.tsx
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { AuditLog, PaginatedResponse } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Table from '@/components/ui/Table';
import PaginationBar from '@/components/ui/Pagination';
import FilterBar from '@/components/ui/FilterBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useModal } from '@/components/ui/Modal';
import JsonViewer from '@/components/ui/JsonViewer';
import { ScrollText, Eye } from 'lucide-react';
import { format } from 'date-fns';

function AuditLogsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openModal } = useModal();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const module = searchParams.get('module') ?? '';
  const result = searchParams.get('result') ?? '';

  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (module) params.set('module', module);
        if (result) params.set('result', result);

        const res = await api.get<PaginatedResponse<AuditLog>>(`/api/admin/audit-logs?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [page, q, module, result]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleViewMetadata = (log: AuditLog) => {
    openModal({
      title: 'Audit Log Details',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase">Actor</p>
              <p className="font-medium text-slate-900">
                {log.admin ? `${log.admin.firstName} ${log.admin.lastName}` : log.adminId}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase">IP Address</p>
              <p className="font-mono text-slate-700">{log.ipAddress ?? 'N/A'}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase">Action</p>
              <p className="text-slate-700">{log.action}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase">Resource</p>
              <p className="text-slate-700">
                {log.resource} {log.resourceId ? `(${log.resourceId})` : ''}
              </p>
            </div>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] font-semibold text-slate-500 uppercase">Metadata</p>
            <JsonViewer data={log.metadata} />
          </div>
        </div>
      ),
      cancelLabel: 'Close',
    });
  };

  return (
    <RequirePermission action={ACTIONS.AUDIT.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Audit Logs</h2>
          <p className="text-sm text-slate-500">Track and monitor all administrative actions.</p>
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search actor email or action..."
          filters={[
            {
              key: 'module',
              label: 'All Modules',
              options: [
                { label: 'Auth', value: 'AUTH' },
                { label: 'Users', value: 'USERS' },
                { label: 'KYC', value: 'KYC' },
                { label: 'Jobs', value: 'JOBS' },
                { label: 'RBAC', value: 'RBAC' },
                { label: 'Subscriptions', value: 'SUBSCRIPTIONS' },
              ],
            },
            {
              key: 'result',
              label: 'All Results',
              options: [
                { label: 'Success', value: 'SUCCESS' },
                { label: 'Failure', value: 'FAILURE' },
                { label: 'Denied', value: 'DENIED' },
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
            icon={<ScrollText className="h-6 w-6" />}
            title="No audit logs found"
            description="Adjust your search or filters to find what you're looking for."
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(l) => l.id}
              columns={[
                {
                  key: 'timestamp',
                  header: 'Timestamp',
                  render: (l) => (
                    <span className="font-mono text-xs text-slate-600">
                      {format(new Date(l.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </span>
                  ),
                },
                {
                  key: 'admin',
                  header: 'Actor',
                  render: (l) => (
                    <div>
                      <p className="font-medium text-slate-900">
                        {l.admin ? `${l.admin.firstName} ${l.admin.lastName}` : 'System'}
                      </p>
                      <p className="text-xs text-slate-500">{l.admin?.email}</p>
                    </div>
                  ),
                },
                {
                  key: 'action',
                  header: 'Action',
                  render: (l) => (
                    <div>
                      <p className="font-medium text-slate-900">{l.action}</p>
                      <p className="text-xs text-slate-500">{l.module}</p>
                    </div>
                  ),
                },
                {
                  key: 'result',
                  header: 'Result',
                  render: (l) => <StatusBadge status={l.result} />,
                },
                {
                  key: 'details',
                  header: '',
                  className: 'text-right',
                  render: (l) => (
                    <button
                      onClick={() => handleViewMetadata(l)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
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

export default function AuditLogsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <AuditLogsPageContent />
    </Suspense>
  );
}
