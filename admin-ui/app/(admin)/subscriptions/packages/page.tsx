'use client';

// admin-ui/app/(admin)/subscriptions/packages/page.tsx
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import { usePermissions } from '@/lib/permissions-context';
import type { SubscriptionPackage } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Table from '@/components/ui/Table';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Package, Plus, Pencil, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import PackageForm from '../PackageForm';

export default function PackagesPage() {
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.SUBSCRIPTIONS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadPackages() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<SubscriptionPackage[]>('/api/admin/subscriptions/packages');
        setPackages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load packages');
      } finally {
        setLoading(false);
      }
    }
    loadPackages();
  }, [reloadKey]);

  const openForm = (initial?: SubscriptionPackage) => {
    openModal({
      title: initial ? 'Edit Package' : 'New Package',
      content: (
        <PackageForm
          initial={initial}
          onSaved={() => {
            closeModal();
            toast({
              type: 'success',
              message: initial ? 'Package updated.' : 'Package created.',
            });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleDelete = (pkg: SubscriptionPackage) => {
    openModal({
      title: 'Delete package?',
      description: `"${pkg.name}" will be permanently deleted. Employers currently on this package are not migrated automatically.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/subscriptions/packages/${pkg.id}`);
          toast({ type: 'success', message: 'Package deleted.' });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to delete package',
          });
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.SUBSCRIPTIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/subscriptions"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Subscription Packages</h2>
              <p className="text-sm text-slate-500">Manage available subscription plans.</p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => openForm()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Package
            </button>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : loading ? (
          <SkeletonTable rows={5} />
        ) : packages.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No packages found"
            description={canManage ? 'Create your first subscription package.' : undefined}
          />
        ) : (
          <Table
            data={packages}
            getRowKey={(p) => p.id}
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (p) => (
                  <div>
                    <p className="flex items-center gap-1.5 font-medium text-slate-900">
                      {p.name}
                      {p.aiScoringEnabled && (
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-label="AI scoring enabled" />
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </div>
                ),
              },
              {
                key: 'limits',
                header: 'Limits',
                render: (p) => (
                  <div className="font-mono text-xs text-slate-600">
                    <p>{p.maxActiveJobs} jobs · {p.maxTeamMembers} members</p>
                    <p>{p.featuredJobSlots} featured slots</p>
                  </div>
                ),
              },
              {
                key: 'price',
                header: 'Price',
                render: (p) => (
                  <div className="font-mono text-xs text-slate-600">
                    <p>{p.priceMonthly ?? '0'} /mo</p>
                    <p>{p.priceYearly ?? '0'} /yr</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (p) => <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />,
              },
              ...(canManage
                ? [
                    {
                      key: 'actions',
                      header: '',
                      className: 'text-right',
                      render: (p: SubscriptionPackage) => (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openForm(p)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
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
        )}
      </div>
    </RequirePermission>
  );
}
