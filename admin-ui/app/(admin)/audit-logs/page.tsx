'use client';

// admin-ui/app/(admin)/audit-logs/page.tsx
// Two tabs backed by separate endpoints:
//   Admin Actions → GET /api/admin/audit-logs        (AdminAuditLog)
//   Auth Logs     → GET /api/admin/audit-logs/auth   (AuthAuditLog)
// Both DTOs take `search` (not `q`) for the text filter.
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { AuditLog, AuthAuditLog, PaginatedResponse } from '@/lib/types';
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

type AuditTab = 'admin' | 'auth';

function AuditLogsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openModal } = useModal();

  const tab: AuditTab = searchParams.get('tab') === 'auth' ? 'auth' : 'admin';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const module = searchParams.get('module') ?? '';
  const result = searchParams.get('result') ?? '';
  const status = searchParams.get('status') ?? '';

  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [authData, setAuthData] = useState<PaginatedResponse<AuthAuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('search', q);

        if (tab === 'auth') {
          if (status) params.set('status', status);
          const res = await api.get<PaginatedResponse<AuthAuditLog>>(
            `/api/admin/audit-logs/auth?${params.toString()}`,
          );
          setAuthData(res);
        } else {
          if (module) params.set('module', module);
          if (result) params.set('result', result);
          const res = await api.get<PaginatedResponse<AuditLog>>(
            `/api/admin/audit-logs?${params.toString()}`,
          );
          setData(res);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [tab, page, q, module, result, status]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleTabChange = (newTab: AuditTab) => {
    if (newTab === tab) return;
    // Filters and page are tab-specific — start the other tab clean.
    router.push(newTab === 'auth' ? '?tab=auth' : '?');
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

  const handleViewAuthMetadata = (log: AuthAuditLog) => {
    openModal({
      title: 'Auth Log Details',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase">User</p>
              <p className="font-medium text-slate-900">
                {log.user ? `${log.user.firstName} ${log.user.lastName}` : (log.userId ?? 'Unknown')}
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
              <p className="font-mono text-[10px] text-slate-500 uppercase">User Agent</p>
              <p className="truncate text-slate-700" title={log.userAgent}>{log.userAgent ?? 'N/A'}</p>
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

  const activeData = tab === 'auth' ? authData : data;

  return (
    <RequirePermission action={ACTIONS.AUDIT.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Audit Logs</h2>
          <p className="text-sm text-slate-500">Track and monitor all administrative actions.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
          {(
            [
              { key: 'admin', label: 'Admin Actions' },
              { key: 'auth', label: 'Auth Logs' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'admin' ? (
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
                  { label: 'Testimonials', value: 'testimonials' },
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
        ) : (
          <FilterBar
            searchKey="q"
            searchPlaceholder="Search user email, action or IP..."
            filters={[
              {
                key: 'status',
                label: 'All Statuses',
                options: [
                  { label: 'Success', value: 'SUCCESS' },
                  { label: 'Failure', value: 'FAILURE' },
                ],
              },
            ]}
          />
        )}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <SkeletonTable rows={10} />
        ) : !activeData || activeData.items.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-6 w-6" />}
            title={tab === 'auth' ? 'No auth logs found' : 'No audit logs found'}
            description="Adjust your search or filters to find what you're looking for."
          />
        ) : tab === 'auth' && authData ? (
          <div className="space-y-4">
            <Table
              data={authData.items}
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
                  key: 'user',
                  header: 'User',
                  render: (l) => (
                    <div>
                      <p className="font-medium text-slate-900">
                        {l.user ? `${l.user.firstName} ${l.user.lastName}` : 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{l.user?.email}</p>
                    </div>
                  ),
                },
                {
                  key: 'action',
                  header: 'Action',
                  render: (l) => <p className="font-medium text-slate-900">{l.action}</p>,
                },
                {
                  key: 'ip',
                  header: 'IP Address',
                  render: (l) => (
                    <span className="font-mono text-xs text-slate-600">{l.ipAddress ?? '—'}</span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (l) => <StatusBadge status={l.status} />,
                },
                {
                  key: 'details',
                  header: '',
                  className: 'text-right',
                  render: (l) => (
                    <button
                      onClick={() => handleViewAuthMetadata(l)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  ),
                },
              ]}
            />
            <PaginationBar pagination={authData.pagination} onPageChange={handlePageChange} />
          </div>
        ) : data ? (
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
            <PaginationBar pagination={data.pagination} onPageChange={handlePageChange} />
          </div>
        ) : null}
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
