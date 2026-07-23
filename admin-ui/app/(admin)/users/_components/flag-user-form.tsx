'use client';

// admin-ui/app/(admin)/users/_components/flag-user-form.tsx

import { useState } from 'react';
import { api } from '@/lib';
import type { User } from '@/lib';

interface Props {
  userId: string;
  onSaved: (updated: User) => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function FlagUserForm({ userId, onSaved, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updated = await api.patch<User>(`/api/admin/users/${userId}/flag`, { reason });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flag user');
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
        <label className={labelCls}>Reason</label>
        <textarea
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputCls}
          placeholder="e.g. Suspected fake company profile, multiple content reports, scraping activity…"
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
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {saving ? 'Flagging…' : 'Flag user'}
        </button>
      </div>
    </form>
  );
}
