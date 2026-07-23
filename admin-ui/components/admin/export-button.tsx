'use client';

// admin-ui/components/admin/export-button.tsx
// Reusable "Export CSV" trigger + params modal, dropped onto the page for
// each entity (users, jobs, applications, subscriptions) rather than a
// single standalone /export page.

import { useState } from 'react';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import { useModal } from '@/components/ui';
import { Download } from 'lucide-react';

type Entity = 'users' | 'jobs' | 'applications' | 'subscriptions';

const USER_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'PENDING_DELETION', 'SUSPENDED', 'DELETED'];
const USER_ROLES = ['SEEKER', 'EMPLOYER'];
const JOB_STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED', 'EXPIRED'];

const ENTITY_LABEL: Record<Entity, string> = {
  users: 'Users',
  jobs: 'Jobs',
  applications: 'Applications',
  subscriptions: 'Subscriptions',
};

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

function ExportForm({ entity, onDone }: { entity: Entity; onDone: () => void }) {
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

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
    <div className="space-y-4">
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

      {entity === 'subscriptions' && (
        <p className="text-sm text-slate-500">Exports all employer subscriptions as CSV.</p>
      )}

      <div className="flex justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </button>
        <a
          href={href}
          download
          onClick={onDone}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>
    </div>
  );
}

interface ExportButtonProps {
  entity: Entity;
  /** Overrides the default "Export {Entity}" button label */
  label?: string;
}

export default function ExportButton({ entity, label }: ExportButtonProps) {
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();

  if (!has(ACTIONS.EXPORT.RUN)) return null;

  const openExportModal = () => {
    openModal({
      title: `Export ${ENTITY_LABEL[entity]}`,
      content: <ExportForm entity={entity} onDone={closeModal} />,
    });
  };

  return (
    <button
      onClick={openExportModal}
      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
    >
      <Download className="h-4 w-4" />
      {label ?? `Export ${ENTITY_LABEL[entity]}`}
    </button>
  );
}
