'use client';

// admin-ui/app/(admin)/subscriptions/PackageForm.tsx
// Create/edit package form rendered inside the Modal's content slot.
// Backend UpdatePackageDto has no `name` — packages cannot be renamed.

import { useState } from 'react';
import { api } from '@/lib/api';
import type { SubscriptionPackage } from '@/lib/types';

interface PackageFormProps {
  initial?: SubscriptionPackage;
  onSaved: (pkg: SubscriptionPackage) => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function PackageForm({ initial, onSaved, onCancel }: PackageFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [maxActiveJobs, setMaxActiveJobs] = useState(initial?.maxActiveJobs ?? 1);
  const [maxTeamMembers, setMaxTeamMembers] = useState(initial?.maxTeamMembers ?? 1);
  const [featuredJobSlots, setFeaturedJobSlots] = useState(initial?.featuredJobSlots ?? 0);
  const [aiScoringEnabled, setAiScoringEnabled] = useState(initial?.aiScoringEnabled ?? false);
  const [jobPostingPeriodDays, setJobPostingPeriodDays] = useState(initial?.jobPostingPeriodDays ?? 30);
  const [resumeViewEnabled, setResumeViewEnabled] = useState(initial?.resumeViewEnabled ?? false);
  const [canExportApplicants, setCanExportApplicants] = useState(initial?.canExportApplicants ?? false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(initial?.analyticsEnabled ?? false);
  const [prioritySupportEnabled, setPrioritySupportEnabled] = useState(initial?.prioritySupportEnabled ?? false);
  const [priceMonthly, setPriceMonthly] = useState(initial?.priceMonthly ?? '0');
  const [priceYearly, setPriceYearly] = useState(initial?.priceYearly ?? '0');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const numbers = {
      maxActiveJobs,
      maxTeamMembers,
      featuredJobSlots,
      aiScoringEnabled,
      jobPostingPeriodDays,
      resumeViewEnabled,
      canExportApplicants,
      analyticsEnabled,
      prioritySupportEnabled,
      priceMonthly: Number(priceMonthly),
      priceYearly: Number(priceYearly),
    };

    try {
      const saved = initial
        ? await api.patch<SubscriptionPackage>(`/api/admin/subscriptions/packages/${initial.id}`, {
            description: description.trim(),
            ...numbers,
            isActive,
          })
        : await api.post<SubscriptionPackage>('/api/admin/subscriptions/packages', {
            name: name.trim(),
            ...(description.trim() ? { description: description.trim() } : {}),
            ...numbers,
          });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save package');
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
        <label className={labelCls}>Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!!initial}
          title={initial ? 'Packages cannot be renamed' : undefined}
          className={inputCls}
          placeholder="Growth"
        />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
          placeholder="For growing teams"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Max active jobs</label>
          <input
            type="number"
            min={1}
            required
            value={maxActiveJobs}
            onChange={(e) => setMaxActiveJobs(Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Max team members</label>
          <input
            type="number"
            min={1}
            required
            value={maxTeamMembers}
            onChange={(e) => setMaxTeamMembers(Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Featured job slots</label>
          <input
            type="number"
            min={0}
            required
            value={featuredJobSlots}
            onChange={(e) => setFeaturedJobSlots(Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Price monthly</label>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={priceMonthly}
            onChange={(e) => setPriceMonthly(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Price yearly</label>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={priceYearly}
            onChange={(e) => setPriceYearly(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Job posting period (days)</label>
        <input
          type="number"
          min={1}
          required
          value={jobPostingPeriodDays}
          onChange={(e) => setJobPostingPeriodDays(Number(e.target.value))}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {([
          ['aiScoringEnabled', 'AI scoring', aiScoringEnabled, setAiScoringEnabled],
          ['resumeViewEnabled', 'Resume view', resumeViewEnabled, setResumeViewEnabled],
          ['canExportApplicants', 'Export applicants', canExportApplicants, setCanExportApplicants],
          ['analyticsEnabled', 'Analytics', analyticsEnabled, setAnalyticsEnabled],
          ['prioritySupportEnabled', 'Priority support', prioritySupportEnabled, setPrioritySupportEnabled],
        ] as [string, string, boolean, (v: boolean) => void][]).map(([key, label, value, setter]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setter(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            {label}
          </label>
        ))}
        {initial && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Active
          </label>
        )}
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create package'}
        </button>
      </div>
    </form>
  );
}
