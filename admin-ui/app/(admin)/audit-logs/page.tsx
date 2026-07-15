'use client';

// admin-ui/app/(admin)/audit-logs/page.tsx
// Three tabs, each backed by its own endpoint:
//   Audit Logs (auth)     → GET /api/admin/audit-logs                (AuthAuditLog + AdminAuthAuditLog, merged)
//   System Logs           → GET /api/admin/audit-logs/system         (AuditLog — main app business actions)
//   Admin Activity Logs   → GET /api/admin/audit-logs/admin-activity (AdminAuditLog — console mutations)
// All three take `search` (not `q`) for the text filter; date-range uses `from`/`to`.
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { AdminActivityLog, SystemAuditLog, UnifiedAuthLog, PaginatedResponse } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { FilterBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useModal } from '@/components/ui';
import { JsonViewer } from '@/components/ui';
import { ScrollText, Eye } from 'lucide-react';
import { format } from 'date-fns';

type AuditTab = 'audit' | 'system' | 'admin';

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'desc' },
  { label: 'Oldest first', value: 'asc' },
];

function SourceBadge({ source }: { source: 'MAIN_APP' | 'ADMIN_CONSOLE' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium ${
        source === 'ADMIN_CONSOLE'
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-cyan-200 bg-cyan-50 text-cyan-700'
      }`}
    >
      {source === 'ADMIN_CONSOLE' ? 'Admin Console' : 'Main App'}
    </span>
  );
}

function AuditLogsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openModal } = useModal();

  const tab: AuditTab =
    searchParams.get('tab') === 'system' ? 'system' : searchParams.get('tab') === 'admin' ? 'admin' : 'audit';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const module = searchParams.get('module') ?? '';
  const result = searchParams.get('result') ?? '';
  const riskLevel = searchParams.get('riskLevel') ?? '';
  const status = searchParams.get('status') ?? '';
  const source = searchParams.get('source') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const sortOrder = searchParams.get('sortOrder') ?? '';

  const [authData, setAuthData] = useState<PaginatedResponse<UnifiedAuthLog> | null>(null);
  const [systemData, setSystemData] = useState<PaginatedResponse<SystemAuditLog> | null>(null);
  const [adminData, setAdminData] = useState<PaginatedResponse<AdminActivityLog> | null>(null);
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
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (sortOrder) params.set('sortOrder', sortOrder);

        if (tab === 'audit') {
          if (status) params.set('status', status);
          if (source) params.set('source', source);
          const res = await api.get<PaginatedResponse<UnifiedAuthLog>>(
            `/api/admin/audit-logs?${params.toString()}`,
          );
          setAuthData(res);
        } else if (tab === 'system') {
          if (module) params.set('module', module);
          if (result) params.set('result', result);
          if (riskLevel) params.set('riskLevel', riskLevel);
          const res = await api.get<PaginatedResponse<SystemAuditLog>>(
            `/api/admin/audit-logs/system?${params.toString()}`,
          );
          setSystemData(res);
        } else {
          if (module) params.set('module', module);
          if (result) params.set('result', result);
          if (riskLevel) params.set('riskLevel', riskLevel);
          const res = await api.get<PaginatedResponse<AdminActivityLog>>(
            `/api/admin/audit-logs/admin-activity?${params.toString()}`,
          );
          setAdminData(res);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [tab, page, q, module, result, riskLevel, status, source, from, to, sortOrder]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleTabChange = (newTab: AuditTab) => {
    if (newTab === tab) return;
    // Filters and page are tab-specific — start the other tab clean.
    router.push(newTab === 'audit' ? '?' : `?tab=${newTab}`);
  };

  const handleViewAuthMetadata = (log: UnifiedAuthLog) => {
    openModal({
      title: 'Auth Log Details',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase">Actor</p>
              <p className="font-medium text-slate-900">
                {log.actorEmail ?? log.actorId ?? 'Unknown'}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase">Source</p>
              <p className="text-slate-700">{log.source === 'ADMIN_CONSOLE' ? 'Admin Console' : 'Main App'}</p>
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

  const handleViewSystemMetadata = (log: SystemAuditLog) => {
    openModal({
      title: 'System Log Details',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase">Actor</p>
              <p className="font-medium text-slate-900">
                {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : log.actorId}
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
              <p className="font-mono text-[10px] text-slate-500 uppercase">Target</p>
              <p className="text-slate-700">
                {log.targetType} {log.targetId ? `(${log.targetId})` : ''}
              </p>
            </div>
            {log.reason && (
              <div className="col-span-2">
                <p className="font-mono text-[10px] text-slate-500 uppercase">Reason</p>
                <p className="text-slate-700">{log.reason}</p>
              </div>
            )}
          </div>
          {(log.oldData != null || log.newData != null) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 font-mono text-[10px] font-semibold text-slate-500 uppercase">Before</p>
                <JsonViewer data={log.oldData} />
              </div>
              <div>
                <p className="mb-2 font-mono text-[10px] font-semibold text-slate-500 uppercase">After</p>
                <JsonViewer data={log.newData} />
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 font-mono text-[10px] font-semibold text-slate-500 uppercase">Metadata</p>
            <JsonViewer data={log.metadata} />
          </div>
        </div>
      ),
      cancelLabel: 'Close',
    });
  };

  const handleViewAdminMetadata = (log: AdminActivityLog) => {
    openModal({
      title: 'Admin Activity Details',
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
            {log.reason && (
              <div className="col-span-2">
                <p className="font-mono text-[10px] text-slate-500 uppercase">Reason</p>
                <p className="text-slate-700">{log.reason}</p>
              </div>
            )}
          </div>
          {(log.oldData != null || log.newData != null) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 font-mono text-[10px] font-semibold text-slate-500 uppercase">Before</p>
                <JsonViewer data={log.oldData} />
              </div>
              <div>
                <p className="mb-2 font-mono text-[10px] font-semibold text-slate-500 uppercase">After</p>
                <JsonViewer data={log.newData} />
              </div>
            </div>
          )}
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
          <p className="text-sm text-slate-500">Investigate authentication events and platform activity.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
          {(
            [
              { key: 'audit', label: 'Audit Logs' },
              { key: 'system', label: 'System Logs' },
              { key: 'admin', label: 'Admin Activity Logs' },
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

        {tab === 'audit' ? (
          <FilterBar
            searchKey="q"
            searchPlaceholder="Search actor email, action or IP..."
            dateRange={{ fromKey: 'from', toKey: 'to' }}
            sort={{ key: 'sortOrder', label: 'Sort', options: SORT_OPTIONS }}
            filters={[
              {
                key: 'source',
                label: 'All Sources',
                options: [
                  { label: 'Main App', value: 'MAIN_APP' },
                  { label: 'Admin Console', value: 'ADMIN_CONSOLE' },
                ],
              },
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
        ) : tab === 'system' ? (
          <FilterBar
            searchKey="q"
            searchPlaceholder="Search actor email or action..."
            dateRange={{ fromKey: 'from', toKey: 'to' }}
            sort={{
              key: 'sortOrder',
              label: 'Sort',
              options: SORT_OPTIONS,
            }}
            filters={[
              {
                key: 'module',
                label: 'All Modules',
                options: [
                  { label: 'Jobs', value: 'JOBS' },
                  { label: 'KYC', value: 'KYC' },
                  { label: 'Applications', value: 'APPLICATIONS' },
                  { label: 'Team', value: 'TEAM' },
                  { label: 'Company', value: 'COMPANY' },
                  { label: 'Profile', value: 'PROFILE' },
                  { label: 'Settings', value: 'SETTINGS' },
                ],
              },
              {
                key: 'riskLevel',
                label: 'All Risk Levels',
                options: [
                  { label: 'Low', value: 'LOW' },
                  { label: 'Medium', value: 'MEDIUM' },
                  { label: 'High', value: 'HIGH' },
                  { label: 'Critical', value: 'CRITICAL' },
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
            searchPlaceholder="Search actor email or action..."
            dateRange={{ fromKey: 'from', toKey: 'to' }}
            sort={{
              key: 'sortOrder',
              label: 'Sort',
              options: SORT_OPTIONS,
            }}
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
                key: 'riskLevel',
                label: 'All Risk Levels',
                options: [
                  { label: 'Low', value: 'LOW' },
                  { label: 'Medium', value: 'MEDIUM' },
                  { label: 'High', value: 'HIGH' },
                  { label: 'Critical', value: 'CRITICAL' },
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
        )}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <SkeletonTable rows={10} />
        ) : tab === 'audit' ? (
          !authData || authData.items.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="h-6 w-6" />}
              title="No auth logs found"
              description="Adjust your search or filters to find what you're looking for."
            />
          ) : (
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
                    key: 'source',
                    header: 'Source',
                    render: (l) => <SourceBadge source={l.source} />,
                  },
                  {
                    key: 'actor',
                    header: 'Actor',
                    render: (l) => (
                      <div>
                        <p className="font-medium text-slate-900">
                          {l.actorFirstName ? `${l.actorFirstName} ${l.actorLastName ?? ''}`.trim() : 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500">{l.actorEmail}</p>
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
          )
        ) : tab === 'system' ? (
          !systemData || systemData.items.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="h-6 w-6" />}
              title="No system logs found"
              description="Adjust your search or filters to find what you're looking for."
            />
          ) : (
            <div className="space-y-4">
              <Table
                data={systemData.items}
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
                    key: 'actor',
                    header: 'Actor',
                    render: (l) => (
                      <div>
                        <p className="font-medium text-slate-900">
                          {l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500">{l.actor?.email}</p>
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
                    key: 'target',
                    header: 'Target',
                    render: (l) => (
                      <span className="font-mono text-xs text-slate-600">
                        {l.targetType ? `${l.targetType}${l.targetId ? ` (${l.targetId.slice(0, 8)})` : ''}` : '—'}
                      </span>
                    ),
                  },
                  {
                    key: 'risk',
                    header: 'Risk',
                    render: (l) => <StatusBadge status={l.riskLevel} />,
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
                        onClick={() => handleViewSystemMetadata(l)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    ),
                  },
                ]}
              />
              <PaginationBar pagination={systemData.pagination} onPageChange={handlePageChange} />
            </div>
          )
        ) : !adminData || adminData.items.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-6 w-6" />}
            title="No admin activity found"
            description="Adjust your search or filters to find what you're looking for."
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={adminData.items}
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
                  key: 'risk',
                  header: 'Risk',
                  render: (l) => <StatusBadge status={l.riskLevel} />,
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
                      onClick={() => handleViewAdminMetadata(l)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  ),
                },
              ]}
            />
            <PaginationBar pagination={adminData.pagination} onPageChange={handlePageChange} />
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
