'use client';

// admin-ui/app/(admin)/announcements/_components/announcement-form.tsx
// Create/edit form rendered inside the Modal's content slot.

import { useState } from 'react';
import { api } from '@/lib';
import type { Announcement, AnnouncementTarget } from '@/lib';

interface AnnouncementFormProps {
  initial?: Announcement;
  onSaved: (saved: Announcement) => void;
  onCancel: () => void;
}

interface FormFields {
  message: string;
  type: 'info' | 'warning' | 'critical';
  target: AnnouncementTarget;
  startsAt: string;
  expiresAt: string;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

function toDatetimeLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AnnouncementForm({ initial, onSaved, onCancel }: AnnouncementFormProps) {
  const [fields, setFields] = useState<FormFields>({
    message: initial?.message ?? '',
    type: initial?.type ?? 'info',
    target: initial?.target ?? 'ALL',
    startsAt: toDatetimeLocal(initial?.startsAt),
    expiresAt: toDatetimeLocal(initial?.expiresAt),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      message: fields.message.trim(),
      type: fields.type,
      target: fields.target,
      startsAt: fields.startsAt ? new Date(fields.startsAt).toISOString() : undefined,
      expiresAt: fields.expiresAt ? new Date(fields.expiresAt).toISOString() : undefined,
    };

    try {
      const saved = initial
        ? await api.patch<Announcement>(`/api/admin/announcements/${initial.id}`, payload)
        : await api.post<Announcement>('/api/admin/announcements', payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className={labelCls}>Message</label>
        <textarea
          required
          minLength={5}
          maxLength={2000}
          rows={4}
          value={fields.message}
          onChange={(e) => set('message', e.target.value)}
          className={inputCls}
          placeholder="Scheduled maintenance on Sunday, 2am–4am IST…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select
            value={fields.type}
            onChange={(e) => set('type', e.target.value as FormFields['type'])}
            className={inputCls}
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Target</label>
          <select
            value={fields.target}
            onChange={(e) => set('target', e.target.value as AnnouncementTarget)}
            className={inputCls}
          >
            <option value="ALL">All users</option>
            <option value="SEEKER">Seekers only</option>
            <option value="EMPLOYER">Employers only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Starts at (optional)</label>
          <input
            type="datetime-local"
            value={fields.startsAt}
            onChange={(e) => set('startsAt', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Expires at (optional)</label>
          <input
            type="datetime-local"
            value={fields.expiresAt}
            onChange={(e) => set('expiresAt', e.target.value)}
            className={inputCls}
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create announcement'}
        </button>
      </div>
    </form>
  );
}
