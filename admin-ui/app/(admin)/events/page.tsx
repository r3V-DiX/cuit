'use client';

// admin-ui/app/(admin)/events/page.tsx
// Events / "What's New" management dashboard — mirrors blogs/page.tsx.

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib';
import type { Event as WhatsNewEvent, AdminEventsResponse } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import { ACTIONS } from '@/lib';
import { Button, useToast, useModal } from '@/components/ui';
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  Edit3,
  Trash2,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  FileText,
  Layers,
  Tag,
} from 'lucide-react';

export default function EventsPage() {
  const { has } = usePermissions();
  const { toast } = useToast();
  const { openModal, closeModal } = useModal();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AdminEventsResponse>({
    items: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    metrics: { total: 0, published: 0, drafts: 0, categories: 0 },
  });

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [page, setPage] = useState<number>(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const canManage = has(ACTIONS.EVENTS.MANAGE);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter === 'PUBLISHED') params.set('isPublished', 'true');
      if (statusFilter === 'DRAFT') params.set('isPublished', 'false');

      const res = await api.get<AdminEventsResponse>(`/api/admin/events?${params.toString()}`);
      setData(res);
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch events.',
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleTogglePublish = async (event: WhatsNewEvent) => {
    if (!canManage) return;
    setTogglingId(event.id);
    const endpoint = event.isPublished
      ? `/api/admin/events/${event.id}/unpublish`
      : `/api/admin/events/${event.id}/publish`;

    try {
      await api.patch(endpoint);
      toast({
        type: 'success',
        message: `Event "${event.title}" ${event.isPublished ? 'unpublished to Draft' : 'published live'}.`,
      });
      fetchEvents();
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update event publication status.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (event: WhatsNewEvent) => {
    openModal({
      title: 'Delete Event',
      variant: 'danger',
      description: `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete Event',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/events/${event.id}`);
          toast({ type: 'success', message: 'Event deleted successfully.' });
          closeModal();
          fetchEvents();
        } catch (err: unknown) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to delete event.',
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B3C8B] text-white shadow-md shadow-blue-900/20">
            <Calendar className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">What&apos;s New</h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage events, seminars, and announcements shown on the public site.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchEvents()}
            className="flex items-center space-x-1.5"
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {canManage && (
            <Link
              href="/events/new"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1B3C8B] text-white hover:bg-blue-900 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Events</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-800">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold tracking-tight text-slate-900 tabular-nums">
            {data.metrics?.total ?? 0}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Published Live</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold tracking-tight text-emerald-700 tabular-nums">
            {data.metrics?.published ?? 0}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Drafts</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Edit3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold tracking-tight text-amber-700 tabular-nums">
            {data.metrics?.drafts ?? 0}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Categories</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold tracking-tight text-purple-700 tabular-nums">
            {data.metrics?.categories ?? 0}
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title, slug, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

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

      {/* ── Events Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B3C8B]" />
          <p className="text-xs font-medium">Loading events...</p>
        </div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No events found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {search || statusFilter !== 'ALL'
              ? 'Try adjusting your search terms or status filter.'
              : 'No events exist yet. Create your first one.'}
          </p>
          {canManage && (
            <Link
              href="/events/new"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1B3C8B] text-white hover:bg-blue-900 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Event</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((event) => (
            <div
              key={event.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" />

              <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                {event.bannerImage ? (
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}

                {event.category && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-white bg-slate-900/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      <Tag className="h-2.5 w-2.5" />
                      {event.category}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {event.isPublished && (
                    <a
                      href={
                        typeof window !== 'undefined' &&
                        (window.location.hostname.includes('admin.cykruit.com') ||
                          window.location.hostname.includes('cykruit.com'))
                          ? `https://cykruit.com/whats-new/${event.slug}`
                          : `http://localhost:3000/whats-new/${event.slug}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white text-slate-700 hover:bg-slate-100 shadow-sm transition"
                      title="View Live on Cykruit"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {canManage && (
                    <>
                      <Link
                        href={`/events/${event.id}/edit`}
                        className="p-2 rounded-lg bg-white text-slate-700 hover:bg-slate-100 shadow-sm transition"
                        title="Edit Event (Full Screen)"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(event)}
                        className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50 shadow-sm transition"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">{event.title}</p>
                  <p className="font-mono text-[10px] text-slate-400 mt-0.5">/{event.slug}</p>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {event.location}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(event)}
                    disabled={!canManage || togglingId === event.id}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                      event.isPublished
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    } ${!canManage ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {togglingId === event.id ? (
                      <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
                    ) : (
                      <span className={`h-2 w-2 rounded-full ${event.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    )}
                    <span>{event.isPublished ? 'Published Live' : 'Draft'}</span>
                  </button>
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
            {data.pagination.total} events
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
