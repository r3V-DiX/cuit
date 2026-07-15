'use client';

// admin-ui/app/(admin)/testimonials/TestimonialForm.tsx
// Create/edit form rendered inside the Modal's content slot; manages its own
// submit state and buttons (the modal footer is not used for forms).

import { useState } from 'react';
import { api } from '@/lib';
import type { Testimonial } from '@/lib';

interface TestimonialFormProps {
  initial?: Testimonial;
  onSaved: (saved: Testimonial) => void;
  onCancel: () => void;
}

interface FormFields {
  type: 'SEEKER' | 'EMPLOYER';
  name: string;
  role: string;
  company: string;
  avatar: string;
  avatarColor: string;
  quote: string;
  stars: number;
  tag: string;
  isPublished: boolean;
  sortOrder: number;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function TestimonialForm({ initial, onSaved, onCancel }: TestimonialFormProps) {
  const [fields, setFields] = useState<FormFields>({
    type: initial?.type ?? 'SEEKER',
    name: initial?.name ?? '',
    role: initial?.role ?? '',
    company: initial?.company ?? '',
    avatar: initial?.avatar ?? '',
    avatarColor: initial?.avatarColor ?? '',
    quote: initial?.quote ?? '',
    stars: initial?.stars ?? 5,
    tag: initial?.tag ?? '',
    isPublished: initial?.isPublished ?? false,
    sortOrder: initial?.sortOrder ?? 0,
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
      type: fields.type,
      name: fields.name.trim(),
      role: fields.role.trim(),
      company: fields.company.trim(),
      quote: fields.quote.trim(),
      stars: fields.stars,
      isPublished: fields.isPublished,
      sortOrder: fields.sortOrder,
      ...(fields.avatar.trim() ? { avatar: fields.avatar.trim() } : {}),
      ...(fields.avatarColor.trim() ? { avatarColor: fields.avatarColor.trim() } : {}),
      ...(fields.tag.trim() ? { tag: fields.tag.trim() } : {}),
    };

    try {
      const saved = initial
        ? await api.patch<Testimonial>(`/api/admin/testimonials/${initial.id}`, payload)
        : await api.post<Testimonial>('/api/admin/testimonials', payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save testimonial');
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select
            value={fields.type}
            onChange={(e) => set('type', e.target.value as FormFields['type'])}
            className={inputCls}
          >
            <option value="SEEKER">Seeker</option>
            <option value="EMPLOYER">Employer</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Stars (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={fields.stars}
            onChange={(e) => set('stars', Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Name</label>
        <input
          required
          minLength={2}
          maxLength={100}
          value={fields.name}
          onChange={(e) => set('name', e.target.value)}
          className={inputCls}
          placeholder="Jane Doe"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Role</label>
          <input
            required
            minLength={2}
            maxLength={150}
            value={fields.role}
            onChange={(e) => set('role', e.target.value)}
            className={inputCls}
            placeholder="Security Analyst"
          />
        </div>
        <div>
          <label className={labelCls}>Company</label>
          <input
            required
            minLength={2}
            maxLength={150}
            value={fields.company}
            onChange={(e) => set('company', e.target.value)}
            className={inputCls}
            placeholder="Acme Corp"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Quote</label>
        <textarea
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          value={fields.quote}
          onChange={(e) => set('quote', e.target.value)}
          className={inputCls}
          placeholder="What they said…"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Avatar (emoji)</label>
          <input
            maxLength={10}
            value={fields.avatar}
            onChange={(e) => set('avatar', e.target.value)}
            className={inputCls}
            placeholder="🧑‍💻"
          />
        </div>
        <div>
          <label className={labelCls}>Avatar color</label>
          <input
            maxLength={50}
            value={fields.avatarColor}
            onChange={(e) => set('avatarColor', e.target.value)}
            className={inputCls}
            placeholder="bg-blue-100"
          />
        </div>
        <div>
          <label className={labelCls}>Tag</label>
          <input
            maxLength={50}
            value={fields.tag}
            onChange={(e) => set('tag', e.target.value)}
            className={inputCls}
            placeholder="SOC Analyst"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3">
        <div>
          <label className={labelCls}>Sort order</label>
          <input
            type="number"
            min={0}
            value={fields.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <label className="flex items-center gap-2 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={fields.isPublished}
            onChange={(e) => set('isPublished', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Published
        </label>
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create testimonial'}
        </button>
      </div>
    </form>
  );
}
