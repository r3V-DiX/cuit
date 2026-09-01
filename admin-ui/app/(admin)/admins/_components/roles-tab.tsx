'use client';

// admin-ui/app/(admin)/admins/_components/roles-tab.tsx
// Roles list — create role, link to role detail (permissions matrix lives
// at /rbac/roles/[id], unchanged by the admins/rbac page merge).

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib';
import type { RbacRole, Permission } from '@/lib';
import { Table } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { Shield, Plus } from 'lucide-react';
import RoleForm from './role-form';

interface RolesTabProps {
  canManage: boolean;
}

export default function RolesTab({ canManage }: RolesTabProps) {
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadRoles() {
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
        setError(err instanceof Error ? err.message : 'Failed to load roles');
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
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

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (loading) return <SkeletonTable rows={5} />;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={openCreateRole}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Role
          </button>
        </div>
      )}

      {roles.length === 0 ? (
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
                  <p className="font-medium text-slate-900 group-hover:text-blue-600">{r.name}</p>
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
              render: (r) => <StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
            },
          ]}
        />
      )}
    </div>
  );
}
