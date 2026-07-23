'use client';

// admin-ui/app/(admin)/blacklist/_components/blacklist-bulk-form.tsx

import { useState } from 'react';
import { api } from '@/lib';
import type { BlacklistType } from '@/lib';

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function BlacklistBulkForm({ onSaved, onCancel }: Props) {
  const [values, setValues] = useState('');
  const [type, setType] = useState<BlacklistType>('DOMAIN');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const entries = values
      .split('\n')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .map((value) => ({ value, type }));

    if (entries.length === 0) {
      setError('Enter at least one value.');
      setSaving(false);
      return;
    }

    try {
      await api.post('/api/admin/blacklist/bulk', { entries });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entries');
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
        <label className={labelCls}>Type (applies to all entries below)</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as BlacklistType)}
          className={inputCls}
        >
          <option value="EMAIL">Email</option>
          <option value="DOMAIN">Domain</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>Values — one per line</label>
        <textarea
          required
          rows={8}
          value={values}
          onChange={(e) => setValues(e.target.value)}
          className={inputCls}
          placeholder={'mailinator.com\nguerrillamail.com\nyopmail.com'}
        />
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
          {saving ? 'Adding…' : 'Add entries'}
        </button>
      </div>
    </form>
  );
}
