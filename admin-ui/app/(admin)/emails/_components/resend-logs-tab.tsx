'use client';

// admin-ui/app/(admin)/emails/_components/resend-logs-tab.tsx
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib';
import type { ResendEmailLogItem, PaginatedResponse } from '@/lib';
import {
  Mail,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Send,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Inbox,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { EmailDetailDrawer } from './email-detail-drawer';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}min ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return '1d ago';
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ResendLogsTab() {
  const [data, setData] = useState<PaginatedResponse<ResendEmailLogItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [direction, setDirection] = useState<'sending' | 'receiving'>('sending');

  const loadLogs = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '20');
        if (statusFilter) params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await api.get<PaginatedResponse<ResendEmailLogItem>>(
          `/api/admin/emails/resend/logs?${params.toString()}`,
        );
        setData(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load Resend email logs');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, statusFilter, search],
  );

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLogs(true);
  };

  const getStatusBadge = (item: ResendEmailLogItem) => {
    const status = (item.last_event || item.status || 'sent').toLowerCase();

    if (status === 'delivered') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Delivered</span>
        </span>
      );
    }
    if (status === 'suppressed') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          <span>Suppressed</span>
        </span>
      );
    }
    if (status === 'bounced' || status === 'failed') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          <span>Bounced</span>
        </span>
      );
    }
    if (status === 'complained') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Complained</span>
        </span>
      );
    }
    if (status === 'opened' || status === 'clicked') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          <span className="capitalize">{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const emails = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Resend Subheader Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center space-x-2">
          {/* Sending / Receiving toggle */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200/60 text-xs font-semibold">
            <button
              onClick={() => setDirection('sending')}
              className={`px-3 py-1 rounded-md transition ${
                direction === 'sending'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sending
            </button>
            <button
              onClick={() => setDirection('receiving')}
              className={`px-3 py-1 rounded-md transition ${
                direction === 'receiving'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Receiving
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
          {/* Search bar */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipient, subject, sender..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B3C8B] focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-100/80 focus:outline-none focus:ring-1 focus:ring-[#1B3C8B] cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="sent">Sent</option>
              <option value="bounced">Bounced</option>
              <option value="suppressed">Suppressed</option>
              <option value="complained">Complained</option>
            </select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 text-xs flex items-center space-x-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-16 text-center shadow-2xs">
          <Loader2 className="h-7 w-7 animate-spin text-[#1B3C8B] mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-500">Fetching live email activity from Resend...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && emails.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-2xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1B3C8B] mb-3">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Emails Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {search || statusFilter
              ? 'No transactional emails match your search filters.'
              : 'No transactional email activity recorded in Resend recently.'}
          </p>
        </div>
      )}

      {/* Resend Activity Table */}
      {!loading && emails.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Sent</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {emails.map((item) => {
                  const recipientStr = Array.isArray(item.to) ? item.to.join(', ') : item.to;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedEmailId(item.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Recipient */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 group-hover:bg-emerald-100 transition">
                            <Mail className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-mono text-xs font-medium text-slate-900 truncate max-w-xs">
                            {recipientStr}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">{getStatusBadge(item)}</td>

                      {/* Subject */}
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        <span className="truncate max-w-md block">{item.subject || '(No Subject)'}</span>
                      </td>

                      {/* Sent */}
                      <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap text-[11px]">
                        {formatRelativeTime(item.created_at)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmailId(item.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition"
                          title="View Details"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t border-slate-100 p-3 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
              <span>
                Page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.total} total)
              </span>
              <div className="flex items-center space-x-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={pagination.page <= 1}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="h-7 px-2 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Drawer Modal */}
      {selectedEmailId && (
        <EmailDetailDrawer
          emailId={selectedEmailId}
          onClose={() => setSelectedEmailId(null)}
        />
      )}
    </div>
  );
}
