'use client';

// admin-ui/app/(admin)/discounts/_components/discount-form.tsx

import { useState, useEffect } from 'react';
import { api } from '@/lib';
import type {
  Discount,
  DiscountTrigger,
  DiscountType,
  DiscountApplicability,
  BillingCycle,
  SubscriptionPackage,
} from '@/lib';

interface Props {
  initial?: Discount;
  onSaved: () => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';
const checkboxRowCls = 'flex items-center gap-2 text-sm text-slate-700';

function toDateInput(iso?: string | null) {
  return iso ? iso.slice(0, 10) : '';
}

export default function DiscountForm({ initial, onSaved, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [trigger, setTrigger] = useState<DiscountTrigger>(initial?.trigger ?? 'AUTOMATIC');
  const [discountType, setDiscountType] = useState<DiscountType>(initial?.discountType ?? 'PERCENTAGE');
  const [value, setValue] = useState(initial?.value ?? '');
  const [maxDiscountCap, setMaxDiscountCap] = useState(initial?.maxDiscountCap?.toString() ?? '');
  const [minOrderAmountPaise, setMinOrderAmountPaise] = useState(initial?.minOrderAmountPaise?.toString() ?? '');
  const [applicability, setApplicability] = useState<DiscountApplicability>(initial?.applicability ?? 'ALL_PACKAGES');
  const [packageIds, setPackageIds] = useState<string[]>(initial?.packages?.map((p) => p.packageId) ?? []);
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>(initial?.billingCycles ?? []);
  const [maxTotalUses, setMaxTotalUses] = useState(initial?.maxTotalUses?.toString() ?? '');
  const [maxUsesPerUser, setMaxUsesPerUser] = useState(initial?.maxUsesPerUser ?? 1);
  const [startsAt, setStartsAt] = useState(toDateInput(initial?.startsAt) || toDateInput(new Date().toISOString()));
  const [expiresAt, setExpiresAt] = useState(toDateInput(initial?.expiresAt));
  const [description, setDescription] = useState(initial?.description ?? '');

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (applicability !== 'SPECIFIC_PACKAGES') return;
    api.get<SubscriptionPackage[]>('/api/admin/subscriptions/packages').then(setPackages).catch(() => {});
  }, [applicability]);

  function toggleFrom<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      name,
      ...(trigger === 'COUPON_CODE' ? { code } : {}),
      discountType,
      value: Number(value),
      maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : undefined,
      minOrderAmountPaise: minOrderAmountPaise ? Number(minOrderAmountPaise) : undefined,
      applicability,
      ...(applicability === 'SPECIFIC_PACKAGES' ? { packageIds } : {}),
      billingCycles,
      maxTotalUses: maxTotalUses ? Number(maxTotalUses) : undefined,
      maxUsesPerUser: Number(maxUsesPerUser),
      startsAt: new Date(startsAt).toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      description: description || undefined,
    };

    try {
      if (initial) {
        await api.patch(`/api/admin/discounts/${initial.id}`, body);
      } else {
        await api.post('/api/admin/discounts', { ...body, trigger });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save discount');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className={labelCls}>Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Summer Sale" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Trigger</label>
          <select
            value={trigger}
            disabled={!!initial}
            onChange={(e) => setTrigger(e.target.value as DiscountTrigger)}
            className={`${inputCls} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
          >
            <option value="AUTOMATIC">Automatic</option>
            <option value="COUPON_CODE">Coupon code</option>
          </select>
        </div>
        {trigger === 'COUPON_CODE' && (
          <div>
            <label className={labelCls}>Code</label>
            <input
              required
              value={code ?? ''}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={inputCls}
              placeholder="SUMMER20"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)} className={inputCls}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FLAT">Flat (₹)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Value</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            max={discountType === 'PERCENTAGE' ? 100 : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Max cap (paise)</label>
          <input
            type="number"
            min="0"
            value={maxDiscountCap}
            onChange={(e) => setMaxDiscountCap(e.target.value)}
            className={inputCls}
            placeholder="Uncapped"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Applicability</label>
        <select
          value={applicability}
          onChange={(e) => setApplicability(e.target.value as DiscountApplicability)}
          className={inputCls}
        >
          <option value="ALL_PACKAGES">All packages</option>
          <option value="SPECIFIC_PACKAGES">Specific packages</option>
        </select>
      </div>

      {applicability === 'SPECIFIC_PACKAGES' && (
        <div className="space-y-1.5 rounded-xl border border-slate-200 p-3">
          {packages.length === 0 ? (
            <p className="text-xs text-slate-400">Loading packages…</p>
          ) : (
            packages.map((p) => (
              <label key={p.id} className={checkboxRowCls}>
                <input
                  type="checkbox"
                  checked={packageIds.includes(p.id)}
                  onChange={() => setPackageIds((prev) => toggleFrom(prev, p.id))}
                />
                {p.name}
              </label>
            ))
          )}
        </div>
      )}

      <div>
        <label className={labelCls}>Billing cycles</label>
        <div className="flex gap-4">
          {(['MONTHLY', 'YEARLY'] as BillingCycle[]).map((cycle) => (
            <label key={cycle} className={checkboxRowCls}>
              <input
                type="checkbox"
                checked={billingCycles.includes(cycle)}
                onChange={() => setBillingCycles((prev) => toggleFrom(prev, cycle))}
              />
              {cycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-400">None checked = applies to both.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Min order amount (paise)</label>
          <input
            type="number"
            min="0"
            value={minOrderAmountPaise}
            onChange={(e) => setMinOrderAmountPaise(e.target.value)}
            className={inputCls}
            placeholder="None"
          />
        </div>
        <div>
          <label className={labelCls}>Max uses per employer</label>
          <input
            required
            type="number"
            min="1"
            value={maxUsesPerUser}
            onChange={(e) => setMaxUsesPerUser(Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Max total uses</label>
          <input
            type="number"
            min="1"
            value={maxTotalUses}
            onChange={(e) => setMaxTotalUses(e.target.value)}
            className={inputCls}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Starts</label>
          <input required type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Expires</label>
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} placeholder="Never" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
          rows={2}
          maxLength={500}
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create discount'}
        </button>
      </div>
    </form>
  );
}
