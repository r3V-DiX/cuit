'use client';

// admin-ui/app/(admin)/rbac/RoleForm.tsx
// Create-role form rendered inside the Modal's content slot.

import { useState } from 'react';
import { api } from '@/lib';
import type { RbacRole, Permission } from '@/lib';

interface RoleFormProps {
  permissions: Permission[];
  onSaved: (role: RbacRole) => void;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';

export default function RoleForm({ permissions, onSaved, onCancel }: RoleFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modules = [...new Set(permissions.map((p) => p.module))];

  function togglePermission(id: string) {
    setPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const role = await api.post<RbacRole>('/api/admin/rbac/roles', {
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(permissionIds.length ? { permissionIds } : {}),
      });
      onSaved(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
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
        <label className={labelCls}>Role name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="content_editor"
        />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
          placeholder="What this role is for"
        />
      </div>

      <div>
        <label className={labelCls}>Permissions</label>
        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          {modules.map((mod) => (
            <div key={mod}>
              <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {mod}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {permissions
                  .filter((p) => p.module === mod)
                  .map((p) => (
                    <label key={p.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={permissionIds.includes(p.id)}
                        onChange={() => togglePermission(p.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-mono text-xs">{p.action}</span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
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
          {saving ? 'Creating…' : 'Create role'}
        </button>
      </div>
    </form>
  );
}
