'use client';

// admin-ui/app/(admin)/announcements/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { Announcement, PaginatedResponse } from '@/lib';
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
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import AnnouncementForm from './_components/announcement-form';

function isExpired(a: Announcement): boolean {
  return !!a.expiresAt && new Date(a.expiresAt) <= new Date();
}

function isScheduled(a: Announcement): boolean {
  return !!a.startsAt && new Date(a.startsAt) > new Date();
}

function statusOf(a: Announcement): string {
  if (!a.isActive) return 'INACTIVE';
  if (isExpired(a)) return 'EXPIRED';
  if (isScheduled(a)) return 'SCHEDULED';
  return 'ACTIVE';
}

function AnnouncementsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const target = searchParams.get('target') ?? '';
  const isActive = searchParams.get('isActive') ?? '';

  const [data, setData] = useState<PaginatedResponse<Announcement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.ANNOUNCEMENTS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadAnnouncements() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (target) params.set('target', target);
        if (isActive) params.set('isActive', isActive);

        const res = await api.get<PaginatedResponse<Announcement>>(
          `/api/admin/announcements?${params.toString()}`,
        );
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load announcements');
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncements();
  }, [page, target, isActive, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const openForm = (initial?: Announcement) => {
    openModal({
      title: initial ? 'Edit Announcement' : 'New Announcement',
      content: (
        <AnnouncementForm
          initial={initial}
          onSaved={() => {
            closeModal();
            toast({
              type: 'success',
              message: initial ? 'Announcement updated.' : 'Announcement created.',
            });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleToggle = (a: Announcement) => {
    openModal({
      title: `${a.isActive ? 'Deactivate' : 'Activate'} announcement?`,
      description: `This banner will ${a.isActive ? 'stop showing to' : 'start showing to'} users immediately.`,
      variant: a.isActive ? 'default' : 'success',
      confirmLabel: a.isActive ? 'Deactivate' : 'Activate',
      onConfirm: async () => {
        try {
          await api.patch<Announcement>(`/api/admin/announcements/${a.id}/toggle`);
          toast({ type: 'success', message: `Announcement ${a.isActive ? 'deactivated' : 'activated'}.` });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to toggle announcement',
          });
        }
      },
    });
  };

  const handleDelete = (a: Announcement) => {
    openModal({
      title: 'Delete announcement?',
      description: 'This announcement will be permanently deleted. This cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/announcements/${a.id}`);
          toast({ type: 'success', message: 'Announcement deleted.' });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to delete announcement',
          });
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.ANNOUNCEMENTS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Platform Announcements</h2>
            <p className="text-sm text-slate-500">
              Site-wide broadcast banners displayed to job seekers and employers.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => openForm()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </button>
          )}
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search announcements..."
          filters={[
            {
              key: 'target',
              label: 'All Targets',
              options: [
                { label: 'All users', value: 'ALL' },
                { label: 'Seekers', value: 'SEEKER' },
                { label: 'Employers', value: 'EMPLOYER' },
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
            icon={<Megaphone className="h-6 w-6" />}
            title="No announcements found"
            description={
              canManage
                ? 'Create an announcement to show a banner to users.'
                : 'Adjust your filters to find what you are looking for.'
            }
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(a) => a.id}
              columns={[
                {
                  key: 'message',
                  header: 'Message',
                  render: (a) => (
                    <p className="max-w-sm truncate text-slate-900" title={a.message}>
                      {a.message}
                    </p>
                  ),
                },
                {
                  key: 'type',
                  header: 'Type',
                  render: (a) => <StatusBadge status={a.type.toUpperCase()} />,
                },
                {
                  key: 'target',
                  header: 'Target',
                  render: (a) => <span className="text-slate-600">{a.target}</span>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (a) => <StatusBadge status={statusOf(a)} />,
                },
                {
                  key: 'dates',
                  header: 'Window',
                  render: (a) => (
                    <span className="text-xs text-slate-500">
                      {a.startsAt ? new Date(a.startsAt).toLocaleDateString() : '—'}
                      {' → '}
                      {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : 'no end'}
                    </span>
                  ),
                },
                ...(canManage
                  ? [
                      {
                        key: 'actions',
                        header: '',
                        className: 'text-right',
                        render: (a: Announcement) => (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(a)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title={a.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {a.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openForm(a)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(a)}
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

export default function AnnouncementsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <AnnouncementsPageContent />
    </Suspense>
  );
}
