'use client';

// admin-ui/app/(admin)/suggestions/_components/suggestion-form.tsx

import { useState } from 'react';
import { api } from '@/lib';
import type { SearchSuggestion, SuggestionType } from '@/lib';

interface Props {
  initial?: SearchSuggestion;
  onSaved: (saved: SearchSuggestion) => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function SuggestionForm({ initial, onSaved, onCancel }: Props) {
  const [text, setText] = useState(initial?.text ?? '');
  const [type, setType] = useState<SuggestionType>(initial?.type ?? 'ROLE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const saved = initial
        ? await api.patch<SearchSuggestion>(`/api/admin/suggestions/${initial.id}`, { text: text.trim(), type })
        : await api.post<SearchSuggestion>('/api/admin/suggestions', { text: text.trim(), type });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save suggestion');
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
            onChange={(e) => setType(e.target.value as SuggestionType)}
            className={inputCls}
          >
            <option value="ROLE">Role</option>
            <option value="SKILL">Skill</option>
            <option value="COMPANY">Company</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Text</label>
          <input
            required
            maxLength={200}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputCls}
            placeholder="Security Analyst"
          />
        </div>
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add suggestion'}
        </button>
      </div>
    </form>
  );
}
