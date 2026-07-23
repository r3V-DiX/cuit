'use client';

// admin-ui/app/(admin)/blacklist/_components/blacklist-add-form.tsx

import { useState } from 'react';
import { api } from '@/lib';
import type { BlacklistEntry, BlacklistType } from '@/lib';

interface Props {
  onSaved: (saved: BlacklistEntry) => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function BlacklistAddForm({ onSaved, onCancel }: Props) {
  const [value, setValue] = useState('');
  const [type, setType] = useState<BlacklistType>('EMAIL');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const saved = await api.post<BlacklistEntry>('/api/admin/blacklist', {
        value: value.trim(),
        type,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
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
          <label className={labelCls}>{type === 'EMAIL' ? 'Email address' : 'Domain'}</label>
          <input
            required
            maxLength={255}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputCls}
            placeholder={type === 'EMAIL' ? 'spammer@example.com' : 'mailinator.com'}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Reason (optional)</label>
        <input
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputCls}
          placeholder="Disposable email provider"
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
          {saving ? 'Adding…' : 'Add entry'}
        </button>
      </div>
    </form>
  );
}
