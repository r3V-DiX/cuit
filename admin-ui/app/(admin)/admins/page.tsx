'use client';

// admin-ui/app/(admin)/admins/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import { usePermissions } from '@/lib/permissions-context';
import type { AdminAccount, PaginatedResponse } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Table from '@/components/ui/Table';
import PaginationBar from '@/components/ui/Pagination';
import FilterBar from '@/components/ui/FilterBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ShieldCheck, Plus, Ban, RotateCcw } from 'lucide-react';
import InviteAdminForm from './InviteAdminForm';

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function AdminsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has, user } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';

  const [data, setData] = useState<PaginatedResponse<AdminAccount> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.ADMINS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadAdmins() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);

        const res = await api.get<PaginatedResponse<AdminAccount>>(
          `/api/admin/admins?${params.toString()}`,
        );
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admins');
      } finally {
        setLoading(false);
      }
    }
    loadAdmins();
  }, [page, q, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const openInviteForm = () => {
    openModal({
      title: 'Invite Admin',
      content: (
        <InviteAdminForm
          onSent={() => {
            closeModal();
            toast({ type: 'success', message: 'Invitation sent.' });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleDeactivate = (admin: AdminAccount) => {
    openModal({
      title: 'Deactivate admin?',
      description: `"${admin.firstName} ${admin.lastName}" will lose access to the admin console immediately.`,
      variant: 'danger',
      confirmLabel: 'Deactivate',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/admins/${admin.id}`);
          toast({ type: 'success', message: 'Admin deactivated.' });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to deactivate admin',
          });
        }
      },
    });
  };

  const handleReactivate = (admin: AdminAccount) => {
    openModal({
      title: 'Reactivate admin?',
      description: `"${admin.firstName} ${admin.lastName}" will regain access to the admin console.`,
      confirmLabel: 'Reactivate',
      onConfirm: async () => {
        try {
          await api.patch(`/api/admin/admins/${admin.id}/reactivate`);
          toast({ type: 'success', message: 'Admin reactivated.' });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to reactivate admin',
          });
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.ADMINS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Admins</h2>
            <p className="text-sm text-slate-500">
              Manage admin console accounts and invitations.
            </p>
          </div>
          {canManage && (
            <button
              onClick={openInviteForm}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Invite Admin
            </button>
          )}
        </div>

        <FilterBar searchKey="q" searchPlaceholder="Search name or email..." filters={[]} />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <SkeletonTable rows={10} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No admins found"
            description={
              canManage
                ? 'Invite your first admin to give them console access.'
                : 'Adjust your search to find what you are looking for.'
            }
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(a) => a.id}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (a) => (
                    <div>
                      <p className="font-medium text-slate-900">
                        {a.firstName} {a.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{a.email}</p>
                    </div>
                  ),
                },
                {
                  key: 'roles',
                  header: 'Role(s)',
                  render: (a) => (
                    <div className="flex flex-wrap gap-1">
                      {a.roleAssignments.length === 0 ? (
                        <span className="text-xs text-slate-400">No role assigned</span>
                      ) : (
                        a.roleAssignments.map((ra) => (
                          <span
                            key={ra.id}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {ra.role.name}
                          </span>
                        ))
                      )}
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (a) => <StatusBadge status={a.isActive ? 'ACTIVE' : 'INACTIVE'} />,
                },
                {
                  key: 'lastLogin',
                  header: 'Last Login',
                  render: (a) => (
                    <span className="text-slate-600">{formatDate(a.lastLogin)}</span>
                  ),
                },
                ...(canManage
                  ? [
                      {
                        key: 'actions',
                        header: '',
                        className: 'text-right',
                        render: (a: AdminAccount) =>
                          a.id === user?.id ? (
                            <span className="text-xs text-slate-400">You</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              {a.isActive ? (
                                <button
                                  onClick={() => handleDeactivate(a)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  title="Deactivate"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(a)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                  title="Reactivate"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              )}
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

export default function AdminsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <AdminsPageContent />
    </Suspense>
  );
}
