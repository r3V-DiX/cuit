'use client';

// admin-ui/app/(admin)/subscriptions/AssignSubscriptionForm.tsx
// Assign (or replace) an employer's subscription. "Check" looks up the
// employer's current subscription so the admin sees what they are replacing.

import { useState } from 'react';
import { api, ApiError } from '@/lib';
import type { EmployerSubscription, SubscriptionPackage } from '@/lib';

interface AssignSubscriptionFormProps {
  packages: SubscriptionPackage[];
  onSaved: (sub: EmployerSubscription) => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function AssignSubscriptionForm({
  packages,
  onSaved,
  onCancel,
}: AssignSubscriptionFormProps) {
  const [employerId, setEmployerId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [current, setCurrent] = useState<EmployerSubscription | null>(null);
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    if (!employerId.trim()) return;
    setChecking(true);
    setError(null);
    setChecked(false);
    try {
      const sub = await api.get<EmployerSubscription>(
        `/api/admin/subscriptions/employer/${employerId.trim()}`,
      );
      setCurrent(sub);
      setChecked(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCurrent(null);
        setChecked(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to look up employer');
      }
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const sub = await api.post<EmployerSubscription>('/api/admin/subscriptions/assign', {
        employerId: employerId.trim(),
        packageId,
        status,
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
        <label className={labelCls}>Employer ID</label>
        <div className="flex gap-2">
          <input
            required
            value={employerId}
            onChange={(e) => {
              setEmployerId(e.target.value);
              setChecked(false);
              setCurrent(null);
            }}
            className={inputCls}
            placeholder="UUID of the employer"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!employerId.trim() || checking}
            className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {checking ? 'Checking…' : 'Check'}
          </button>
        </div>
        {checked && (
          <p className="mt-1.5 text-xs text-slate-500">
            {current
              ? `Current: ${current.package?.name ?? current.packageId} (${current.status}) — assigning will replace it.`
              : 'No existing subscription for this employer.'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
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
          disabled={!packageId || saving}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Assigning…' : 'Assign subscription'}
        </button>
      </div>
    </form>
  );
}
