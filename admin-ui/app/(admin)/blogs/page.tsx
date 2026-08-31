'use client';

// admin-ui/app/(admin)/blogs/page.tsx
// Hallmark Anti-Slop Blogs Management Dashboard with CRUD & Publication Workflows

import { useState, useEffect, useCallback, useTransition } from 'react';
import { api } from '@/lib';
import type { Blog, AdminBlogsResponse } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import { ACTIONS } from '@/lib';
import { Button, useToast, useModal, StatusBadge } from '@/components/ui';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  Globe,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import BlogEditorModal from './_components/blog-editor-modal';

export default function BlogsPage() {
  const { has } = usePermissions();
  const { toast } = useToast();
  const { openModal, closeModal } = useModal();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AdminBlogsResponse>({
    items: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    metrics: { total: 0, published: 0, drafts: 0, categories: 0 },
  });

  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [page, setPage] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const canManage = has(ACTIONS.BLOGS.MANAGE);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (statusFilter === 'PUBLISHED') params.set('isPublished', 'true');
      if (statusFilter === 'DRAFT') params.set('isPublished', 'false');

      const res = await api.get<AdminBlogsResponse>(`/api/admin/blogs?${params.toString()}`);
      setData(res);
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch blog articles.',
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter, toast]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleTogglePublish = async (blog: Blog) => {
    if (!canManage) return;
    setTogglingId(blog.id);
    const endpoint = blog.isPublished
      ? `/api/admin/blogs/${blog.id}/unpublish`
      : `/api/admin/blogs/${blog.id}/publish`;

    try {
      await api.patch(endpoint);
      toast({
        type: 'success',
        message: `Article "${blog.title}" ${blog.isPublished ? 'unpublished to Draft' : 'published live'}.`,
      });
      fetchBlogs();
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update article publication status.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (blog: Blog) => {
    openModal({
      title: 'Delete Blog Article',
      variant: 'danger',
      description: `Are you sure you want to delete "${blog.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete Article',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/blogs/${blog.id}`);
          toast({ type: 'success', message: 'Article deleted successfully.' });
          closeModal();
          fetchBlogs();
        } catch (err: unknown) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to delete article.',
          });
        }
      },
    });
  };

  const handleOpenEditor = (blog?: Blog) => {
    openModal({
      title: blog ? 'Edit Blog Article' : 'Compose New Article',
      size: '5xl',
      content: (
        <BlogEditorModal
          initialBlog={blog}
          onSuccess={() => {
            closeModal();
            fetchBlogs();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B3C8B] text-white shadow-md shadow-blue-900/20">
            <BookOpen className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Blog Articles & Insights
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Author, edit, and publish cybersecurity articles and community guides.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchBlogs()}
            className="flex items-center space-x-1.5"
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenEditor()}
              className="flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Article</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Articles */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Articles
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-800">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold tracking-tight text-slate-900 tabular-nums">
              {data.metrics?.total ?? 0}
            </span>
            <span className="text-[11px] font-medium text-slate-500">Repository total</span>
          </div>
        </div>

        {/* Published Live */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Published Live
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold tracking-tight text-emerald-700 tabular-nums">
              {data.metrics?.published ?? 0}
            </span>
            <span className="text-[11px] font-medium text-emerald-600">Publicly visible</span>
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Drafts
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Edit3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold tracking-tight text-amber-700 tabular-nums">
              {data.metrics?.drafts ?? 0}
            </span>
            <span className="text-[11px] font-medium text-slate-500">Work in progress</span>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Categories
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold tracking-tight text-purple-700 tabular-nums">
              {data.metrics?.categories ?? 0}
            </span>
            <span className="text-[11px] font-medium text-slate-500">Topic domains</span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles by title, slug, or excerpt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Categories</option>
            <option value="Application Security">AppSec</option>
            <option value="Cloud & DevSecOps">Cloud & DevSecOps</option>
            <option value="Threat Intelligence">Threat Intel</option>
            <option value="Career & Hiring">Career & Hiring</option>
            <option value="Offensive Security">Offensive Security</option>
            <option value="Governance & Compliance">Compliance</option>
          </select>

          {/* Status Filter */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  statusFilter === st
                    ? 'bg-white text-blue-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'PUBLISHED' ? 'Published' : 'Drafts'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Articles Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B3C8B]" />
            <p className="text-xs font-medium">Loading blog articles...</p>
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No blog articles found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {search || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search terms or category filters.'
                : 'No articles exist in the repository yet. Create your first publication.'}
            </p>
            {canManage && (
              <Button size="sm" variant="primary" onClick={() => handleOpenEditor()}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create First Article
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50/60 transition group">
                    {/* Cover & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                          {blog.coverImage ? (
                            <img
                              src={blog.coverImage}
                              alt={blog.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                        <div className="space-y-0.5 max-w-md">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-900 transition line-clamp-1">
                            {blog.title}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              /{blog.slug}
                            </span>
                            {blog.excerpt && (
                              <span className="text-[11px] text-slate-500 line-clamp-1 truncate">
                                — {blog.excerpt}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      {blog.category ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Tag className="h-3 w-3 text-slate-400" />
                          <span>{blog.category}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Uncategorized</span>
                      )}
                    </td>

                    {/* Published Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(blog)}
                        disabled={!canManage || togglingId === blog.id}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                          blog.isPublished
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        } ${!canManage ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {togglingId === blog.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
                        ) : (
                          <span
                            className={`h-2 w-2 rounded-full ${
                              blog.isPublished ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                        )}
                        <span>{blog.isPublished ? 'Published Live' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(blog.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {blog.isPublished && (
                          <a
                            href={`http://localhost:3000/blogs/${blog.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-900 hover:bg-slate-100 transition"
                            title="View Live on Cykruit"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}

                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditor(blog)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Edit Article"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(blog)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete Article"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs">
            <span className="text-slate-500">
              Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{' '}
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
              {data.pagination.total} articles
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={data.pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="font-mono px-2 font-medium">
                {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
