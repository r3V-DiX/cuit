'use client';

// admin-ui/components/admin/notification-bell.tsx
// Admin's own notification inbox. No websocket infra exists in admin-ui
// (confirmed — everything here polls, same as GlobalSearch's debounced
// fetch), so unread count is polled on an interval.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib';
import type { AdminNotification, Pagination } from '@/lib';
import { Bell, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(() => {
    api
      .get<{ items: AdminNotification[]; unreadCount: number; pagination: Pagination }>(
        '/api/admin/notifications?unreadOnly=true&limit=1',
      )
      .then((res) => setUnreadCount(res.unreadCount))
      .catch(() => {});
  }, []);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<{ items: AdminNotification[]; unreadCount: number; pagination: Pagination }>(
        '/api/admin/notifications?limit=20',
      )
      .then((res) => {
        setItems(res.items);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) fetchList();
  }

  function handleItemClick(item: AdminNotification) {
    setOpen(false);
    if (!item.isRead) {
      api.patch(`/api/admin/notifications/${item.id}/read`).catch(() => {});
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (item.actionUrl) router.push(item.actionUrl);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[28rem] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Notifications
          </p>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">No notifications yet.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                  !item.isRead ? 'bg-blue-50/60' : ''
                }`}
              >
                <span className="flex w-full items-center gap-1.5">
                  {!item.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                  <span className="truncate text-sm font-medium text-slate-900">{item.title}</span>
                </span>
                <span className="line-clamp-2 text-xs text-slate-500">{item.message}</span>
                <span className="text-[10px] text-slate-400">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
