'use client';

// admin-ui/app/(admin)/export/page.tsx
import { useEffect, useState } from 'react';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Download } from 'lucide-react';

type Entity = 'users' | 'jobs' | 'applications' | 'subscriptions';

const USER_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'PENDING_DELETION', 'SUSPENDED', 'DELETED'];
const USER_ROLES = ['SEEKER', 'EMPLOYER'];
const JOB_STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED', 'EXPIRED'];

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

function ExportPageContent() {
  const { has } = usePermissions();
  const [entity, setEntity] = useState<Entity>('users');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [lastExport, setLastExport] = useState<string | null>(null);

  useEffect(() => {
    if (!has(ACTIONS.AUDIT.VIEW)) return;
    api
      .get<{ items: { createdAt: string }[] }>(
        '/api/admin/audit-logs/admin-activity?module=export&limit=1&sortBy=createdAt&sortOrder=desc',
      )
      .then((res) => setLastExport(res.items[0]?.createdAt ?? null))
      .catch(() => setLastExport(null));
  }, [has]);

  function changeEntity(next: Entity) {
    setEntity(next);
    setStatus('');
    setRole('');
    setFrom('');
    setTo('');
  }

  const params = new URLSearchParams();
  if (entity === 'users') {
    if (status) params.set('status', status);
    if (role) params.set('role', role);
  } else if (entity === 'jobs') {
    if (status) params.set('status', status);
  } else if (entity === 'applications') {
    if (from) params.set('from', from);
    if (to) params.set('to', to);
  }
  const query = params.toString();
  const href = `/api/admin/export/${entity}${query ? `?${query}` : ''}`;

  return (
    <RequirePermission action={ACTIONS.EXPORT.RUN} fallback={<NoAccess />}>
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Data Export</h2>
          <p className="text-sm text-slate-500">
            Download platform data as CSV for compliance, reporting, or migration.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <label className={labelCls}>Entity</label>
            <select value={entity} onChange={(e) => changeEntity(e.target.value as Entity)} className={inputCls}>
              <option value="users">Users</option>
              <option value="jobs">Jobs</option>
              <option value="applications">Applications</option>
              <option value="subscriptions">Subscriptions</option>
            </select>
          </div>

          {entity === 'users' && (
            <>
              <div>
                <label className={labelCls}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                  <option value="">All</option>
                  {USER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
                  <option value="">All</option>
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {entity === 'jobs' && (
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option value="">All</option>
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {entity === 'applications' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          <a
            href={href}
            download
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>

          {lastExport && (
            <p className="text-xs text-slate-400">Last export: {new Date(lastExport).toLocaleString()}</p>
          )}
        </div>
      </div>
    </RequirePermission>
  );
}

export default function ExportPage() {
  return <ExportPageContent />;
}
