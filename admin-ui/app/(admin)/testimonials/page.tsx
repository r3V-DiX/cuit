'use client';

// admin-ui/app/(admin)/testimonials/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { Testimonial, PaginatedResponse } from '@/lib';
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
import { Quote, Plus, Pencil, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import TestimonialForm from './_components/testimonial-form';

function TestimonialsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? '';
  const published = searchParams.get('published') ?? '';

  const [data, setData] = useState<PaginatedResponse<Testimonial> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.TESTIMONIALS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadTestimonials() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (type) params.set('type', type);
        if (published) params.set('published', published);

        const res = await api.get<PaginatedResponse<Testimonial>>(
          `/api/admin/testimonials?${params.toString()}`,
        );
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load testimonials');
      } finally {
        setLoading(false);
      }
    }
    loadTestimonials();
  }, [page, q, type, published, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const openForm = (initial?: Testimonial) => {
    openModal({
      title: initial ? 'Edit Testimonial' : 'New Testimonial',
      content: (
        <TestimonialForm
          initial={initial}
          onSaved={() => {
            closeModal();
            toast({
              type: 'success',
              message: initial ? 'Testimonial updated.' : 'Testimonial created.',
            });
            refresh();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleTogglePublish = (t: Testimonial) => {
    const action = t.isPublished ? 'unpublish' : 'publish';
    openModal({
      title: `${t.isPublished ? 'Unpublish' : 'Publish'} testimonial?`,
      description: `"${t.name} — ${t.company}" will ${t.isPublished ? 'be hidden from' : 'appear on'} the public site.`,
      variant: t.isPublished ? 'default' : 'success',
      confirmLabel: t.isPublished ? 'Unpublish' : 'Publish',
      onConfirm: async () => {
        try {
          await api.patch<Testimonial>(`/api/admin/testimonials/${t.id}/${action}`);
          toast({ type: 'success', message: `Testimonial ${action}ed.` });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : `Failed to ${action} testimonial`,
          });
        }
      },
    });
  };

  const handleDelete = (t: Testimonial) => {
    openModal({
      title: 'Delete testimonial?',
      description: `"${t.name} — ${t.company}" will be permanently deleted. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/testimonials/${t.id}`);
          toast({ type: 'success', message: 'Testimonial deleted.' });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to delete testimonial',
          });
        }
      },
    });
  };

  return (
    <RequirePermission action={ACTIONS.TESTIMONIALS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Testimonials</h2>
            <p className="text-sm text-slate-500">
              Manage the testimonials shown on the public site.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => openForm()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Testimonial
            </button>
          )}
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search name, role or company..."
          filters={[
            {
              key: 'type',
              label: 'All Types',
              options: [
                { label: 'Seeker', value: 'SEEKER' },
                { label: 'Employer', value: 'EMPLOYER' },
              ],
            },
            {
              key: 'published',
              label: 'All Statuses',
              options: [
                { label: 'Published', value: 'true' },
                { label: 'Draft', value: 'false' },
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
            icon={<Quote className="h-6 w-6" />}
            title="No testimonials found"
            description={
              canManage
                ? 'Create your first testimonial to feature it on the public site.'
                : 'Adjust your search or filters to find what you are looking for.'
            }
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(t) => t.id}
              columns={[
                {
                  key: 'person',
                  header: 'Person',
                  render: (t) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base">
                        {t.avatar || t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-500">
                          {t.role} · {t.company}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'type',
                  header: 'Type',
                  render: (t) => <StatusBadge status={t.type} />,
                },
                {
                  key: 'quote',
                  header: 'Quote',
                  render: (t) => (
                    <p className="max-w-xs truncate text-slate-600" title={t.quote}>
                      {t.quote}
                    </p>
                  ),
                },
                {
                  key: 'stars',
                  header: 'Stars',
                  render: (t) => (
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {t.stars}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (t) => (
                    <StatusBadge status={t.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                  ),
                },
                ...(canManage
                  ? [
                      {
                        key: 'actions',
                        header: '',
                        className: 'text-right',
                        render: (t: Testimonial) => (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleTogglePublish(t)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title={t.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {t.isPublished ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openForm(t)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(t)}
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

export default function TestimonialsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <TestimonialsPageContent />
    </Suspense>
  );
}
