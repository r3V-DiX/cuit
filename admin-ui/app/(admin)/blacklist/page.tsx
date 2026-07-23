'use client';

// admin-ui/app/(admin)/blacklist/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { BlacklistEntry, PaginatedResponse } from '@/lib';
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
import { ShieldBan, Plus, ListPlus, Trash2 } from 'lucide-react';
import BlacklistAddForm from './_components/blacklist-add-form';
import BlacklistBulkForm from './_components/blacklist-bulk-form';

function BlacklistPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? '';

  const [data, setData] = useState<PaginatedResponse<BlacklistEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.BLACKLIST.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (type) params.set('type', type);

        const res = await api.get<PaginatedResponse<BlacklistEntry>>(
          `/api/admin/blacklist?${params.toString()}`,
        );
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blacklist');
      } finally {
        setLoading(false);
      }
    }
    loadEntries();
  }, [page, q, type, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const openAddForm = () => {
    openModal({
      title: 'Add Blacklist Entry',
      content: (
        <BlacklistAddForm
          onSaved={() => {
            closeModal();
            toast({ type: 'success', message: 'Entry added.' });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const openBulkForm = () => {
    openModal({
      title: 'Bulk Add Entries',
      content: (
        <BlacklistBulkForm
          onSaved={() => {
            closeModal();
            toast({ type: 'success', message: 'Entries added.' });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleDelete = (entry: BlacklistEntry) => {
    openModal({
      title: 'Remove blacklist entry?',
      description: `"${entry.value}" will be removed from the blacklist immediately.`,
      variant: 'danger',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/blacklist/${entry.id}`);
          toast({ type: 'success', message: 'Entry removed.' });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to remove entry',
          });
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.BLACKLIST.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Email / Domain Blacklist</h2>
            <p className="text-sm text-slate-500">
              Block disposable email providers and known spammers at signup.
            </p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={openBulkForm}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ListPlus className="h-4 w-4" />
                Bulk Add
              </button>
              <button
                onClick={openAddForm}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </button>
            </div>
          )}
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search email or domain..."
          filters={[
            {
              key: 'type',
              label: 'All Types',
              options: [
                { label: 'Email', value: 'EMAIL' },
                { label: 'Domain', value: 'DOMAIN' },
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
            icon={<ShieldBan className="h-6 w-6" />}
            title="No blacklist entries found"
            description={
              canManage
                ? 'Add an email or domain to block it at signup.'
                : 'Adjust your search or filters to find what you are looking for.'
            }
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(e) => e.id}
              columns={[
                {
                  key: 'value',
                  header: 'Value',
                  render: (e) => <span className="font-mono text-slate-900">{e.value}</span>,
                },
                {
                  key: 'type',
                  header: 'Type',
                  render: (e) => <StatusBadge status={e.type} />,
                },
                {
                  key: 'reason',
                  header: 'Reason',
                  render: (e) => (
                    <p className="max-w-xs truncate text-slate-600" title={e.reason}>
                      {e.reason || '—'}
                    </p>
                  ),
                },
                {
                  key: 'createdAt',
                  header: 'Added',
                  render: (e) => (
                    <span className="text-xs text-slate-500">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </span>
                  ),
                },
                ...(canManage
                  ? [
                      {
                        key: 'actions',
                        header: '',
                        className: 'text-right',
                        render: (e: BlacklistEntry) => (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDelete(e)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Remove"
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

export default function BlacklistPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <BlacklistPageContent />
    </Suspense>
  );
}
