'use client';

// admin-ui/app/(admin)/domains/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { JobDomain, PaginatedResponse } from '@/lib';
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
import { Layers, Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import DomainForm from './_components/domain-form';

function DomainsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const isActive = searchParams.get('isActive') ?? '';

  const [data, setData] = useState<PaginatedResponse<JobDomain> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.DOMAINS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadDomains() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (isActive) params.set('isActive', isActive);

        const res = await api.get<PaginatedResponse<JobDomain>>(
          `/api/admin/domains?${params.toString()}`,
        );
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job domains');
      } finally {
        setLoading(false);
      }
    }
    loadDomains();
  }, [page, q, isActive, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const openForm = (initial?: JobDomain) => {
    openModal({
      title: initial ? 'Edit Job Domain' : 'New Job Domain',
      content: (
        <DomainForm
          initial={initial}
          onSaved={() => {
            closeModal();
            toast({ type: 'success', message: initial ? 'Domain updated.' : 'Domain added.' });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleToggle = (d: JobDomain) => {
    openModal({
      title: `${d.isActive ? 'Deactivate' : 'Activate'} domain?`,
      description: `"${d.name}" will ${d.isActive ? 'stop' : 'start'} appearing in public domain listings.`,
      variant: d.isActive ? 'default' : 'success',
      confirmLabel: d.isActive ? 'Deactivate' : 'Activate',
      onConfirm: async () => {
        try {
          await api.patch<JobDomain>(`/api/admin/domains/${d.id}/toggle`);
          toast({ type: 'success', message: `Domain ${d.isActive ? 'deactivated' : 'activated'}.` });
          refresh();
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to toggle domain' });
        }
      },
    });
  };

  const handleDelete = (d: JobDomain) => {
    openModal({
      title: 'Delete domain?',
      description: `"${d.name}" will be permanently deleted. This is blocked if any role still references it.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/domains/${d.id}`);
          toast({ type: 'success', message: 'Domain deleted.' });
          refresh();
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete domain' });
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.DOMAINS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Job Domains</h2>
            <p className="text-sm text-slate-500">
              Manage the domain groupings (Offensive Security, Cloud Security, …) that job roles belong to.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => openForm()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Domain
            </button>
          )}
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search domains..."
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
            icon={<Layers className="h-6 w-6" />}
            title="No job domains found"
            description={canManage ? 'Add a domain to start grouping job roles.' : 'Adjust your filters to find what you are looking for.'}
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(d) => d.id}
              columns={[
                { key: 'name', header: 'Name', render: (d) => <span className="text-slate-900">{d.name}</span> },
                { key: 'slug', header: 'Slug', render: (d) => <span className="font-mono text-xs text-slate-500">{d.slug}</span> },
                { key: 'sortOrder', header: 'Sort', render: (d) => <span className="text-slate-500">{d.sortOrder}</span> },
                { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
                {
                  key: 'createdAt',
                  header: 'Date',
                  render: (d) => <span className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>,
                },
                ...(canManage
                  ? [
                      {
                        key: 'actions',
                        header: '',
                        className: 'text-right',
                        render: (d: JobDomain) => (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(d)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title={d.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {d.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => openForm(d)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(d)}
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

export default function DomainsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <DomainsPageContent />
    </Suspense>
  );
}
