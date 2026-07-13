'use client';

// admin-ui/app/(admin)/contact/page.tsx
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { ContactForm, PaginatedResponse } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Table from '@/components/ui/Table';
import PaginationBar from '@/components/ui/Pagination';
import FilterBar from '@/components/ui/FilterBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function ContactPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';

  const [data, setData] = useState<PaginatedResponse<ContactForm> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey] = useState(0);

  useEffect(() => {
    async function loadContactForms() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (status) params.set('status', status);

        const res = await api.get<PaginatedResponse<ContactForm>>(
          `/api/admin/contact?${params.toString()}`,
        );
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact form submissions');
      } finally {
        setLoading(false);
      }
    }
    loadContactForms();
  }, [page, q, status, reloadKey]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <RequirePermission action={ACTIONS.CONTACT.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Contact Form Submissions</h2>
          <p className="text-sm text-slate-500">
            Review and track incoming messages from the public contact form.
          </p>
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search name or email..."
          filters={[
            {
              key: 'status',
              label: 'All Statuses',
              options: [
                { label: 'Pending', value: 'PENDING' },
                { label: 'Reviewed', value: 'REVIEWED' },
                { label: 'Resolved', value: 'RESOLVED' },
                { label: 'Spam', value: 'SPAM' },
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
            icon={<MessageSquare className="h-6 w-6" />}
            title="No contact form submissions found"
            description="Adjust your search or filters to find what you are looking for."
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(c) => c.id}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (c) => (
                    <div>
                      <p className="font-medium text-slate-900">{c.fullName}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </div>
                  ),
                },
                {
                  key: 'message',
                  header: 'Message',
                  render: (c) => (
                    <p className="max-w-xs truncate text-slate-600" title={c.message}>
                      {c.message}
                    </p>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (c) => <StatusBadge status={c.status} />,
                },
                {
                  key: 'date',
                  header: 'Date',
                  render: (c) => <span className="text-slate-600">{formatDate(c.createdAt)}</span>,
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  render: (c) => (
                    <Link
                      href={`/contact/${c.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  ),
                },
              ]}
            />
            <PaginationBar pagination={data.pagination} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </RequirePermission>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <ContactPageContent />
    </Suspense>
  );
}
