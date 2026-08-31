'use client';

// admin-ui/app/(admin)/settings/page.tsx
// Key-value list of platform feature flags. MANAGE-only per ADMIN_TASKS.md F2 —
// there's no useful view-only mode for a toggle list, so the whole page is
// gated on SETTINGS.MANAGE rather than SETTINGS.VIEW.

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { PlatformSetting } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Settings2, Save } from 'lucide-react';

const BOOLEAN_VALUES = new Set(['true', 'false']);

const SETTING_LABELS: Record<string, { title: string; description?: string }> = {
  job_posting_enabled: {
    title: 'Job Postings',
    description: 'Allow employers to create and publish new job postings on the platform.',
  },
  kyc_required: {
    title: 'Mandatory KYC Verification',
    description: 'Require employers to complete identity verification before posting jobs.',
  },
  maintenance_mode: {
    title: 'Platform Maintenance Mode',
    description: 'Show a temporary maintenance screen to non-admin visitors and users.',
  },
  registration_enabled: {
    title: 'User Registration',
    description: 'Allow new job seekers and employers to create accounts on the platform.',
  },
};

function SettingRow({
  setting,
  onSaved,
}: {
  setting: PlatformSetting;
  onSaved: (updated: PlatformSetting) => void;
}) {
  const { toast } = useToast();
  const isBoolean = BOOLEAN_VALUES.has(setting.value.toLowerCase());
  const [value, setValue] = useState(setting.value);
  const [saving, setSaving] = useState(false);

  const dirty = value !== setting.value;

  const meta = SETTING_LABELS[setting.key] ?? {
    title: setting.key
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    description: setting.description,
  };

  const save = async (nextValue: string) => {
    setSaving(true);
    try {
      const updated = await api.patch<PlatformSetting>(
        `/api/admin/settings/${setting.key}`,
        { value: nextValue },
      );
      setValue(updated.value);
      onSaved(updated);
      toast({ type: 'success', message: `${meta.title} setting updated.` });
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update setting',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{meta.title}</p>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            {setting.key}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{meta.description || setting.description}</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Last updated {new Date(setting.updatedAt).toLocaleString()}
        </p>
      </div>

      {isBoolean ? (
        <button
          onClick={() => save(value.toLowerCase() === 'true' ? 'false' : 'true')}
          disabled={saving}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            value.toLowerCase() === 'true' ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              value.toLowerCase() === 'true' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={() => save(value)}
            disabled={saving || !dirty}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsPageContent() {
  const [settings, setSettings] = useState<PlatformSetting[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PlatformSetting[]>('/api/admin/settings');
      setSettings(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = (updated: PlatformSetting) => {
    setSettings((prev) => prev?.map((s) => (s.key === updated.key ? updated : s)) ?? prev);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Platform Settings</h2>
        <p className="text-sm text-slate-500">
          Global feature toggles — flip these without a code deploy.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : loading ? (
        <SkeletonTable rows={4} />
      ) : !settings || settings.length === 0 ? (
        <EmptyState
          icon={<Settings2 className="h-6 w-6" />}
          title="No settings found"
          description="Run the platform-settings seed to create default keys."
        />
      ) : (
        <div className="space-y-3">
          {settings.map((s) => (
            <SettingRow key={s.key} setting={s} onSaved={handleSaved} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequirePermission action={ACTIONS.SETTINGS.MANAGE} fallback={<NoAccess />}>
      <SettingsPageContent />
    </RequirePermission>
  );
}
