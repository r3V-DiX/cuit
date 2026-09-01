'use client';

// admin-ui/app/(admin)/emails/_components/suppressions-tab.tsx
import { useState, useEffect, useCallback } from 'react';
import { api, ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { ResendSuppressionItem } from '@/lib';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Loader2,
} from 'lucide-react';
import { Button, useToast, useModal } from '@/components/ui';

export function SuppressionsTab() {
  const { has } = usePermissions();
  const { toast } = useToast();
  const { openModal, closeModal } = useModal();

  const [items, setItems] = useState<ResendSuppressionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [unsuppressingId, setUnsuppressingId] = useState<string | null>(null);

  const canManage = has(ACTIONS.EMAILS.SEND);

  const loadSuppressions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ items: ResendSuppressionItem[]; total: number }>(
        '/api/admin/emails/resend/suppressions',
      );
      setItems(res.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load suppressions');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSuppressions();
  }, [loadSuppressions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSuppressions(true);
  };

  const handleRemoveSuppression = (email: string) => {
    openModal({
      title: 'Remove Email from Suppression List',
      variant: 'danger',
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Are you sure you want to remove <span className="font-bold text-slate-900">{email}</span> from
            the suppression list?
          </p>
          <p>
            This will allow the system to dispatch transactional emails to this address again. If the
            address is invalid or continues to bounce, Resend may suppress it again.
          </p>
        </div>
      ),
      confirmLabel: 'Unsuppress Email',
      onConfirm: async () => {
        setUnsuppressingId(email);
        try {
          await api.del(`/api/admin/emails/resend/suppressions/${encodeURIComponent(email)}`);
          toast({
            type: 'success',
            message: 'Email Unsuppressed',
            description: `${email} has been removed from suppressions.`,
          });
          setItems((prev) => prev.filter((i) => i.email !== email));
        } catch (err: unknown) {
          toast({
            type: 'error',
            message: 'Failed to unsuppress',
            description: err instanceof Error ? err.message : 'Unknown error',
          });
        } finally {
          setUnsuppressingId(null);
          closeModal();
        }
      },
    });
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.email?.toLowerCase().includes(q) ||
      item.reason?.toLowerCase().includes(q) ||
      item.subject?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppressed emails or reasons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B3C8B] focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center space-x-2">
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
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B3C8B] mx-auto mb-2" />
          <p className="text-xs text-slate-500">Checking Resend suppression list...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredItems.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-2xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Suppressed Emails</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {search
              ? 'No suppressed emails match your search query.'
              : 'All recipient mailboxes are in good standing. No bounced or suppressed emails found.'}
          </p>
        </div>
      )}

      {/* Suppressions Table */}
      {!loading && filteredItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Suppressed Recipient</th>
                  <th className="py-3 px-4">Reason / Event</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Date Suppressed</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-xs font-mono">{item.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[11px] border border-rose-200 uppercase tracking-wider">
                        <ShieldAlert className="h-3 w-3" />
                        <span>{item.reason}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="text-xs truncate max-w-xs block">{item.subject || '—'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>

                    {canManage && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRemoveSuppression(item.email)}
                          disabled={unsuppressingId === item.email}
                          className="inline-flex items-center space-x-1 text-rose-600 hover:text-rose-800 font-semibold text-xs transition px-2 py-1 rounded hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Unsuppress</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
