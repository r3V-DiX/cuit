'use client';

// admin-ui/app/(admin)/roles/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { Role, PaginatedResponse } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { FilterBar } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Tag, Layers, Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import RoleForm from './_components/role-form';

function RolesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const isActive = searchParams.get('isActive') ?? '';

  const [data, setData] = useState<PaginatedResponse<Role> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.ROLES.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadRoles() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (isActive) params.set('isActive', isActive);

        const res = await api.get<PaginatedResponse<Role>>(`/api/admin/roles?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roles');
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, [page, q, isActive, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const openForm = (initial?: Role) => {
    openModal({
      title: initial ? 'Edit Role' : 'New Role',
      content: (
        <RoleForm
          initial={initial}
          onSaved={() => {
            closeModal();
            toast({ type: 'success', message: initial ? 'Role updated.' : 'Role added.' });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleToggle = (r: Role) => {
    openModal({
      title: `${r.isActive ? 'Deactivate' : 'Activate'} role?`,
      description: `"${r.name}" will ${r.isActive ? 'stop' : 'start'} appearing as a selectable job role.`,
      variant: r.isActive ? 'default' : 'success',
      confirmLabel: r.isActive ? 'Deactivate' : 'Activate',
      onConfirm: async () => {
        try {
          await api.patch<Role>(`/api/admin/roles/${r.id}/toggle`);
          toast({ type: 'success', message: `Role ${r.isActive ? 'deactivated' : 'activated'}.` });
          refresh();
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to toggle role' });
        }
      },
    });
  };

  const handleDelete = (r: Role) => {
    openModal({
      title: 'Delete role?',
      description: `"${r.name}" will be permanently deleted. This is blocked if any job still references it.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/roles/${r.id}`);
          toast({ type: 'success', message: 'Role deleted.' });
          refresh();
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete role' });
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.ROLES.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Job Roles</h2>
            <p className="text-sm text-slate-500">
              Manage the roles (Security Analyst, Penetration Tester, …) employers assign jobs to.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/roles/domains"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Layers className="h-4 w-4" />
              Job Domains
            </Link>
            {canManage && (
              <button
                onClick={() => openForm()}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Role
              </button>
            )}
          </div>
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search roles..."
          filters={[
            {
              key: 'isActive',
              label: 'All Statuses',
              options: [
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
              ],
            },
          ]}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <SkeletonTable rows={10} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<Tag className="h-6 w-6" />}
            title="No roles found"
            description={canManage ? 'Add a role to start assigning it to jobs.' : 'Adjust your filters to find what you are looking for.'}
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(r) => r.id}
              columns={[
                { key: 'name', header: 'Name', render: (r) => <span className="text-slate-900">{r.name}</span> },
                {
                  key: 'domain',
                  header: 'Domain',
                  render: (r) => (
                    <span className="text-slate-500">{r.domain?.name ?? '—'}</span>
                  ),
                },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
                {
                  key: 'createdAt',
                  header: 'Created',
                  render: (r) => (
                    <span className="text-sm text-slate-600">
                      {new Date(r.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  ),
                },
                ...(canManage
                  ? [
                      {
                        key: 'actions',
                        header: 'Action',
                        className: 'text-right',
                        render: (r: Role) => (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(r)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title={r.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {r.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => openForm(r)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(r)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
            <PaginationBar pagination={data.pagination} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </RequirePermission>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <RolesPageContent />
    </Suspense>
  );
}
