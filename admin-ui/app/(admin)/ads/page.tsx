'use client';

// admin-ui/app/(admin)/ads/page.tsx

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib';
import type { Ad, AdminAdsResponse } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import { ACTIONS } from '@/lib';
import { Button, useToast, useModal } from '@/components/ui';
import {
  Megaphone,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Layers,
  ExternalLink,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import AdEditorModal from './_components/ad-editor-modal';

export default function AdsPage() {
  const { has } = usePermissions();
  const { toast } = useToast();
  const { openModal, closeModal } = useModal();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AdminAdsResponse>({
    items: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    metrics: { total: 0, active: 0, inactive: 0, slots: 0 },
  });

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState<number>(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const canManage = has(ACTIONS.ADS.MANAGE);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter === 'ACTIVE') params.set('isActive', 'true');
      if (statusFilter === 'INACTIVE') params.set('isActive', 'false');

      const res = await api.get<AdminAdsResponse>(`/api/admin/ads?${params.toString()}`);
      setData(res);
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch ads.',
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleToggleActive = async (ad: Ad) => {
    if (!canManage) return;
    setTogglingId(ad.id);
    const endpoint = ad.isActive
      ? `/api/admin/ads/${ad.id}/deactivate`
      : `/api/admin/ads/${ad.id}/activate`;

    try {
      await api.patch(endpoint);
      toast({
        type: 'success',
        message: `Ad "${ad.slotKey}" ${ad.isActive ? 'deactivated' : 'activated'}.`,
      });
      fetchAds();
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update ad status.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (ad: Ad) => {
    openModal({
      title: 'Delete Ad',
      variant: 'danger',
      description: `Are you sure you want to delete the ad for slot "${ad.slotKey}"? This action cannot be undone.`,
      confirmLabel: 'Delete Ad',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/ads/${ad.id}`);
          toast({ type: 'success', message: 'Ad deleted successfully.' });
          closeModal();
          fetchAds();
        } catch (err: unknown) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to delete ad.',
          });
        }
      },
    });
  };

  const handleOpenEditor = (ad?: Ad) => {
    openModal({
      title: ad ? 'Edit Ad' : 'Create Ad',
      size: 'lg',
      content: (
        <AdEditorModal
          initialAd={ad}
          onSuccess={() => {
            closeModal();
            fetchAds();
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
            <Megaphone className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Ads</h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage non-intrusive ad slots shown on the public site.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchAds()}
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
              className="flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create Ad</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Ads</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-800">
              <Megaphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold tracking-tight text-slate-900 tabular-nums">
            {data.metrics?.total ?? 0}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold tracking-tight text-emerald-700 tabular-nums">
            {data.metrics?.active ?? 0}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Slots in Use</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold tracking-tight text-purple-700 tabular-nums">
            {data.metrics?.slots ?? 0}
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by slot, alt text, or link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
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
              {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Ads Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B3C8B]" />
          <p className="text-xs font-medium">Loading ads...</p>
        </div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No ads found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {search || statusFilter !== 'ALL'
              ? 'Try adjusting your search or status filter.'
              : 'No ads configured yet. Create one for a page slot.'}
          </p>
          {canManage && (
            <Button size="sm" variant="primary" onClick={() => handleOpenEditor()}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create First Ad
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((ad) => (
            <div
              key={ad.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" />

              <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                {ad.imageUrl ? (
                  <img
                    src={ad.previewUrl || ad.imageUrl}
                    alt={ad.altText}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}

                <div className="absolute top-2 left-2">
                  <span className="font-mono text-[10px] font-semibold text-white bg-slate-900/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {ad.slotKey}
                  </span>
                </div>

                {canManage && (
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEditor(ad)}
                      className="p-2 rounded-lg bg-white text-slate-700 hover:bg-slate-100 shadow-sm transition"
                      title="Edit Ad"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ad)}
                      className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50 shadow-sm transition"
                      title="Delete Ad"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-700 font-medium line-clamp-1">{ad.altText}</p>

                <a
                  href={ad.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 truncate"
                  title={ad.linkUrl}
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{ad.linkUrl}</span>
                </a>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(ad)}
                    disabled={!canManage || togglingId === ad.id}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                      ad.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    } ${!canManage ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {togglingId === ad.id ? (
                      <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
                    ) : ad.isActive ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>{ad.isActive ? 'Active' : 'Inactive'}</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(ad.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs text-xs">
          <span className="text-slate-500">
            Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{' '}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
            {data.pagination.total} ads
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
  );
}
