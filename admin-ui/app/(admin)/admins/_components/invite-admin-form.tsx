'use client';

// admin-ui/app/(admin)/admins/InviteAdminForm.tsx
// Create-only form rendered inside the Modal's content slot — invites are
// sent by email, there is no "edit" mode.

import { useEffect, useState } from 'react';
import { api } from '@/lib';
import type { RbacRole } from '@/lib';

interface InviteAdminFormProps {
  onSent: () => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function InviteAdminForm({ onSent, onCancel }: InviteAdminFormProps) {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await api.get<RbacRole[]>('/api/admin/rbac/roles');
        setRoles(res);
      } catch {
        // Non-fatal — invite can still be sent without a pre-assigned role
      } finally {
        setRolesLoading(false);
      }
    }
    loadRoles();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      email: email.trim(),
      ...(roleId ? { roleId } : {}),
    };

    try {
      await api.post('/api/admin/admins/invite', payload);
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
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
        <label className={labelCls}>Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="new-admin@cykruit.com"
        />
      </div>

      <div>
        <label className={labelCls}>Role (optional — pre-assigned on acceptance)</label>
        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          disabled={rolesLoading}
          className={inputCls}
        >
          <option value="">No role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
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
          disabled={saving}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Sending…' : 'Send Invite'}
        </button>
      </div>
    </form>
  );
}
