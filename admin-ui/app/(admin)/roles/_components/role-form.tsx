'use client';

// admin-ui/app/(admin)/roles/_components/role-form.tsx

import { useEffect, useState } from 'react';
import { api } from '@/lib';
import type { Role, JobDomain, PaginatedResponse } from '@/lib';

interface Props {
  initial?: Role;
  onSaved: () => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function RoleForm({ initial, onSaved, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [domainId, setDomainId] = useState(initial?.domainId ?? '');
  const [domains, setDomains] = useState<JobDomain[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PaginatedResponse<JobDomain>>('/api/admin/domains?isActive=true&limit=100')
      .then((res) => setDomains(res.items))
      .catch(() => setDomains([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      description: description || undefined,
      domainId: domainId || null,
    };

    try {
      if (initial) {
        await api.patch(`/api/admin/roles/${initial.id}`, payload);
      } else {
        await api.post('/api/admin/roles', payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className={labelCls}>Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Security Analyst"
        />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
          rows={3}
          placeholder="Optional description of this role"
        />
      </div>

      <div>
        <label className={labelCls}>Domain</label>
        <select
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          className={inputCls}
        >
          <option value="">No domain</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add role'}
        </button>
      </div>
    </form>
  );
}
