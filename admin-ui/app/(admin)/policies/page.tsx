'use client';

// admin-ui/app/(admin)/policies/page.tsx
// Grouped table of PolicyConfig entries. MANAGE-only per ADMIN_TASKS.md F7 —
// same reasoning as the settings page: no useful view-only mode for a value
// list that only super_admin can edit.

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { PolicyConfig } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui';
import { SlidersHorizontal, Save, RotateCcw } from 'lucide-react';

const GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Authentication',
    keys: [
      'otp_request_limit',
      'otp_request_window_minutes',
      'otp_verify_limit',
      'otp_expiry_minutes',
      'otp_email_request_limit',
      'otp_email_request_window_minutes',
    ],
  },
  {
    label: 'Account Lifecycle',
    keys: ['account_deletion_grace_days', 'session_max_lifetime_days', 'max_active_sessions_per_user'],
  },
  {
    label: 'Rate Limits',
    keys: [
      'contact_form_rate_limit',
      'public_search_rate_limit',
      'ai_resume_parse_limit',
      'ai_jd_generate_limit',
    ],
  },
];

function PolicyRow({
  policy,
  onSaved,
}: {
  policy: PolicyConfig;
  onSaved: (updated: PolicyConfig) => void;
}) {
  const { toast } = useToast();
  const [value, setValue] = useState(policy.value);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const dirty = value !== policy.value;

  const save = async () => {
    if (policy.type === 'integer' && !/^-?\d+$/.test(value)) {
      toast({ type: 'error', message: 'Value must be a whole number.' });
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patch<PolicyConfig>(`/api/admin/policies/${policy.key}`, { value });
      setValue(updated.value);
      onSaved(updated);
      toast({ type: 'success', message: `${policy.key} updated.` });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update policy' });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setResetting(true);
    try {
      const updated = await api.post<PolicyConfig>(`/api/admin/policies/reset/${policy.key}`);
      setValue(updated.value);
      onSaved(updated);
      toast({ type: 'success', message: `${policy.key} reset to default.` });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reset policy' });
    } finally {
      setResetting(false);
    }
  };

  const formatPolicyName = (key: string) =>
    key
      .split('_')
      .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(' ');

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{formatPolicyName(policy.key)}</p>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            {policy.key}
          </span>
          {policy.unit && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
              {policy.unit}
            </span>
          )}
        </div>
        {policy.description && <p className="mt-0.5 text-xs text-slate-500">{policy.description}</p>}
        <p className="mt-1 text-[11px] text-slate-400">
          Last updated {new Date(policy.updatedAt).toLocaleString()}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode={policy.type === 'integer' ? 'numeric' : 'text'}
          className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={reset}
          disabled={resetting || saving}
          title="Reset to default"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={save}
          disabled={saving || resetting || !dirty}
          title="Save"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PoliciesPageContent() {
  const [policies, setPolicies] = useState<PolicyConfig[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PolicyConfig[]>('/api/admin/policies');
      setPolicies(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = (updated: PolicyConfig) => {
    setPolicies((prev) => prev?.map((p) => (p.key === updated.key ? updated : p)) ?? prev);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Policy & Rate Limit Controls</h2>
        <p className="text-sm text-slate-500">
          Platform-wide numeric policies — change these without a code deploy.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <SkeletonTable rows={6} />
      ) : !policies || policies.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal className="h-6 w-6" />}
          title="No policies found"
          description="Platform configuration parameters and rate limits will appear here once initialized."
        />
      ) : (
        <div className="space-y-8">
          {GROUPS.map((group) => {
            const rows = policies.filter((p) => group.keys.includes(p.key));
            if (rows.length === 0) return null;
            return (
              <div key={group.label} className="space-y-3">
                <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
                  {group.label}
                </h3>
                {rows.map((p) => (
                  <PolicyRow key={p.key} policy={p} onSaved={handleSaved} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <RequirePermission action={ACTIONS.POLICIES.MANAGE} fallback={<NoAccess />}>
      <PoliciesPageContent />
    </RequirePermission>
  );
}
