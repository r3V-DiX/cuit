'use client';

// admin-ui/app/(admin)/suggestions/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { SearchSuggestion, PaginatedResponse } from '@/lib';
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
import { SearchCode, Plus, ListPlus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import SuggestionForm from './_components/suggestion-form';
import SuggestionBulkForm from './_components/suggestion-bulk-form';

function SuggestionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? '';
  const isActive = searchParams.get('isActive') ?? '';

  const [data, setData] = useState<PaginatedResponse<SearchSuggestion> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.SUGGESTIONS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadSuggestions() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (type) params.set('type', type);
        if (isActive) params.set('isActive', isActive);

        const res = await api.get<PaginatedResponse<SearchSuggestion>>(
          `/api/admin/suggestions?${params.toString()}`,
        );
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    }
    loadSuggestions();
  }, [page, q, type, isActive, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const openForm = (initial?: SearchSuggestion) => {
    openModal({
      title: initial ? 'Edit Suggestion' : 'New Suggestion',
      content: (
        <SuggestionForm
          initial={initial}
          onSaved={() => {
            closeModal();
            toast({ type: 'success', message: initial ? 'Suggestion updated.' : 'Suggestion added.' });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const openBulkForm = () => {
    openModal({
      title: 'Bulk Import Suggestions',
      content: (
        <SuggestionBulkForm
          onSaved={() => {
            closeModal();
            toast({ type: 'success', message: 'Suggestions added.' });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleToggle = (s: SearchSuggestion) => {
    openModal({
      title: `${s.isActive ? 'Deactivate' : 'Activate'} suggestion?`,
      description: `"${s.text}" will ${s.isActive ? 'stop' : 'start'} appearing in autocomplete results.`,
      variant: s.isActive ? 'default' : 'success',
      confirmLabel: s.isActive ? 'Deactivate' : 'Activate',
      onConfirm: async () => {
        try {
          await api.patch<SearchSuggestion>(`/api/admin/suggestions/${s.id}/toggle`);
          toast({ type: 'success', message: `Suggestion ${s.isActive ? 'deactivated' : 'activated'}.` });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to toggle suggestion',
          });
        }
      },
    });
  };

  const handleDelete = (s: SearchSuggestion) => {
    openModal({
      title: 'Delete suggestion?',
      description: `"${s.text}" will be permanently deleted. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/suggestions/${s.id}`);
          toast({ type: 'success', message: 'Suggestion deleted.' });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to delete suggestion',
          });
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.SUGGESTIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Search Suggestions</h2>
            <p className="text-sm text-slate-500">
              Manage the autocomplete suggestions shown in the landing/jobs search box.
            </p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={openBulkForm}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ListPlus className="h-4 w-4" />
                Bulk Import
              </button>
              <button
                onClick={() => openForm()}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Suggestion
              </button>
            </div>
          )}
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search suggestions..."
          filters={[
            {
              key: 'type',
              label: 'All Types',
              options: [
                { label: 'Role', value: 'ROLE' },
                { label: 'Skill', value: 'SKILL' },
                { label: 'Company', value: 'COMPANY' },
              ],
            },
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
            icon={<SearchCode className="h-6 w-6" />}
            title="No suggestions found"
            description={
              canManage
                ? 'Add a suggestion to power the search-box autocomplete.'
                : 'Adjust your search or filters to find what you are looking for.'
            }
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(s) => s.id}
              columns={[
                {
                  key: 'text',
                  header: 'Text',
                  render: (s) => <span className="text-slate-900">{s.text}</span>,
                },
                {
                  key: 'type',
                  header: 'Type',
                  render: (s) => <StatusBadge status={s.type} />,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (s) => <StatusBadge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} />,
                },
                {
                  key: 'createdAt',
                  header: 'Date',
                  render: (s) => (
                    <span className="text-xs text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  ),
                },
                ...(canManage
                  ? [
                      {
                        key: 'actions',
                        header: '',
                        className: 'text-right',
                        render: (s: SearchSuggestion) => (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(s)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title={s.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {s.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => openForm(s)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
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

export default function SuggestionsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <SuggestionsPageContent />
    </Suspense>
  );
}
