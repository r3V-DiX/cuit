'use client';

// admin-ui/app/(admin)/resumes/page.tsx
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { Resume, PaginatedResponse } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { FilterBar } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui';
import { FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResumesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';

  const [data, setData] = useState<PaginatedResponse<Resume> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadResumes() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);

        const res = await api.get<PaginatedResponse<Resume>>(`/api/admin/resumes?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resumes');
      } finally {
        setLoading(false);
      }
    }
    loadResumes();
  }, [page, q]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleView = async (resume: Resume) => {
    setViewingId(resume.id);
    try {
      const { url } = await api.get<{ url: string }>(`/api/admin/resumes/${resume.id}/view`);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to open resume' });
    } finally {
      setViewingId(null);
    }
  };

  return (
    <RequirePermission action={ACTIONS.RESUMES.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Resume Library</h2>
          <p className="text-sm text-slate-500">Browse all resumes uploaded by jobseekers.</p>
        </div>

        <FilterBar searchKey="q" searchPlaceholder="Search file name or seeker..." filters={[]} />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <SkeletonTable rows={10} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No resumes found"
            description="Adjust your search to find what you're looking for."
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(r) => r.id}
              columns={[
                {
                  key: 'seeker',
                  header: 'Seeker',
                  render: (r) => (
                    <div>
                      <p className="font-medium text-slate-900">
                        {r.profile ? `${r.profile.firstName} ${r.profile.lastName}` : '—'}
                      </p>
                      <p className="text-xs text-slate-500">{r.profile?.user?.email}</p>
                    </div>
                  ),
                },
                {
                  key: 'file',
                  header: 'File',
                  render: (r) => (
                    <div>
                      <p className="text-slate-900">{r.fileName}</p>
                      <p className="text-xs text-slate-500">{r.fileType} · {formatFileSize(r.fileSize)}</p>
                    </div>
                  ),
                },
                {
                  key: 'uploadedAt',
                  header: 'Uploaded',
                  render: (r) => (
                    <span className="text-sm text-slate-600">
                      {format(new Date(r.uploadedAt), 'MMM d, yyyy')}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  render: (r) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(r);
                      }}
                      disabled={viewingId === r.id}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {viewingId === r.id ? 'Opening…' : 'View'}
                    </button>
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

export default function ResumesPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <ResumesPageContent />
    </Suspense>
  );
}
