'use client';

// admin-ui/app/(admin)/subscriptions/AssignSubscriptionForm.tsx
// Assign (or replace) an employer's subscription. Always launched from a page
// that already knows the employer (e.g. the subscription detail page) — no
// manual employer ID entry.

import { useState } from 'react';
import { api } from '@/lib';
import type { EmployerSubscription, SubscriptionPackage } from '@/lib';

interface AssignSubscriptionFormProps {
  packages: SubscriptionPackage[];
  employerId: string;
  employerLabel?: string;
  onSaved: (sub: EmployerSubscription) => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function AssignSubscriptionForm({
  packages,
  employerId,
  employerLabel,
  onSaved,
  onCancel,
}: AssignSubscriptionFormProps) {
  const [packageId, setPackageId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const sub = await api.post<EmployerSubscription>('/api/admin/subscriptions/assign', {
        employerId,
        packageId,
      });
      onSaved(sub);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign subscription');
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
        <label className={labelCls}>Employer</label>
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
          {employerLabel ?? employerId}
        </p>
      </div>

      <div>
        <label className={labelCls}>Package</label>
        <select
          required
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          className={inputCls}
        >
          <option value="">Select a package…</option>
          {packages
            .filter((p) => p.isActive)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
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
          disabled={!packageId || saving}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Assigning…' : 'Assign subscription'}
        </button>
      </div>
    </form>
  );
}
