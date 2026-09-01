'use client';

// admin-ui/app/(admin)/rbac/page.tsx
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { RbacRole, Permission } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Shield, ShieldAlert, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import RoleForm from './_components/role-form';

type RbacTab = 'roles' | 'permissions';

export default function RbacPage() {
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RbacTab>('roles');
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.RBAC.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadRbac() {
      setLoading(true);
      setError(null);
      try {
        const [rolesData, permsData] = await Promise.all([
          api.get<RbacRole[]>('/api/admin/rbac/roles'),
          api.get<Permission[]>('/api/admin/rbac/permissions'),
        ]);
        setRoles(rolesData);
        setPermissions(permsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load RBAC data');
      } finally {
        setLoading(false);
      }
    }
    loadRbac();
  }, [reloadKey]);

  const openCreateRole = () => {
    openModal({
      title: 'New Role',
      content: (
        <RoleForm
          permissions={permissions}
          onSaved={() => {
            closeModal();
            toast({ type: 'success', message: 'Role created.' });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const TABS: { key: RbacTab; label: string }[] = [
    { key: 'roles', label: 'Roles' },
    { key: 'permissions', label: 'Permissions Map' },
  ];

  return (
    <RequirePermission action={ACTIONS.RBAC.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Role-Based Access Control</h2>
            <p className="text-sm text-slate-500">Manage roles and permissions for administrators.</p>
          </div>
          {canManage && activeTab === 'roles' && (
            <button
              onClick={openCreateRole}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Role
            </button>
          )}
        </div>

        <div className="flex border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <SkeletonTable rows={5} />
        ) : activeTab === 'roles' ? (
          roles.length === 0 ? (
            <EmptyState
              icon={<Shield className="h-6 w-6" />}
              title="No roles found"
              description="No custom roles have been created yet."
            />
          ) : (
            <Table
              data={roles}
              getRowKey={(r) => r.id}
              columns={[
                {
                  key: 'name',
                  header: 'Role Name',
                  render: (r) => (
                    <Link href={`/rbac/roles/${r.id}`} className="group block">
                      <p className="font-medium text-slate-900 group-hover:text-blue-600">
                        {r.name}
                      </p>
                      <p className="text-xs text-slate-500">{r.description}</p>
                    </Link>
                  ),
                },
                {
                  key: 'permissions',
                  header: 'Permissions',
                  render: (r) => (
                    <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2 font-mono text-xs text-slate-600">
                      {r.permissions?.length || 0} assigned
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => (
                    <StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  ),
                },
              ]}
            />
          )
        ) : (
          permissions.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert className="h-6 w-6" />}
              title="No permissions found"
              description="Permission registry is empty."
            />
          ) : (
            <Table
              data={permissions}
              getRowKey={(p) => p.id}
              columns={[
                {
                  key: 'module',
                  header: 'Module',
                  render: (p) => (
                    <span className="inline-flex h-6 items-center rounded-lg bg-blue-50 px-2 font-mono text-xs font-bold uppercase tracking-wider text-blue-700">
                      {p.module}
                    </span>
                  ),
                },
                {
                  key: 'action',
                  header: 'Action',
                  render: (p) => (
                    <span className="font-mono text-sm text-slate-900">{p.action}</span>
                  ),
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (p) => (
                    <span className="text-slate-600">{p.description}</span>
                  ),
                },
              ]}
            />
          )
        )}
      </div>
    </RequirePermission>
  );
}
