'use client';

// admin-ui/app/(admin)/suggestions/_components/suggestion-bulk-form.tsx

import { useState } from 'react';
import { api } from '@/lib';
import type { SuggestionType } from '@/lib';

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function SuggestionBulkForm({ onSaved, onCancel }: Props) {
  const [values, setValues] = useState('');
  const [type, setType] = useState<SuggestionType>('SKILL');
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
      .map((text) => ({ text, type }));

    if (entries.length === 0) {
      setError('Enter at least one value.');
      setSaving(false);
      return;
    }

    try {
      await api.post('/api/admin/suggestions/bulk', { entries });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add suggestions');
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
          onChange={(e) => setType(e.target.value as SuggestionType)}
          className={inputCls}
        >
          <option value="ROLE">Role</option>
          <option value="SKILL">Skill</option>
          <option value="COMPANY">Company</option>
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
          placeholder={'Penetration Tester\nSOC Analyst\nThreat Hunter'}
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
          {saving ? 'Adding…' : 'Add suggestions'}
        </button>
      </div>
    </form>
  );
}
