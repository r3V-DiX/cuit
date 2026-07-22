"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import { apiFetch, authHeaders } from "@/lib/api";
import {
  Bell, BellOff, CheckCheck, Trash2, X,
  Briefcase, Sparkles, Eye, Shield, ChevronRight,
  Clock, Inbox, Loader2,
} from "lucide-react";

type NotifType = "APPLICATION" | "JOB_MATCH" | "PROFILE_VIEW" | "SYSTEM" | string;

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  createdTs: number;
};

type TabFilter = "all" | NotifType;

const TYPE_CFG: Record<string, { icon: React.ReactNode; iconBg: string; label: string }> = {
  APPLICATION: {
    icon: <Briefcase className="w-4 h-4" />,
    iconBg: "bg-blue-50 text-blue-600 border-blue-100",
    label: "Applications",
  },
  JOB_MATCH: {
    icon: <Sparkles className="w-4 h-4" />,
    iconBg: "bg-violet-50 text-violet-600 border-violet-100",
    label: "Job Matches",
  },
  PROFILE_VIEW: {
    icon: <Eye className="w-4 h-4" />,
    iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    label: "Profile Activity",
  },
  SYSTEM: {
    icon: <Shield className="w-4 h-4" />,
    iconBg: "bg-slate-100 text-slate-500 border-slate-200",
    label: "System",
  },
};

const FALLBACK_CFG = {
  icon: <Bell className="w-4 h-4" />,
  iconBg: "bg-slate-100 text-slate-500 border-slate-200",
  label: "Other",
};

const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "APPLICATION", label: "Applications" },
  { id: "JOB_MATCH", label: "Job Matches" },
  { id: "PROFILE_VIEW", label: "Profile" },
  { id: "SYSTEM", label: "System" },
];

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const { openModal } = useModal();

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const body = await apiFetch<{ items: unknown[] }>("/api/notifications?limit=50");
      setNotifs(
        (body?.data?.items ?? []).map((n: any): Notification => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          actionUrl: n.actionUrl,
          createdAt: n.createdAt,
          createdTs: new Date(n.createdAt).getTime(),
        }))
      );
    } catch {
      toast({ type: "error", message: "Failed to load notifications" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const filtered = useMemo(() => {
    let list = notifs;
    if (activeTab !== "all") list = list.filter((n) => n.type === activeTab);
    if (showUnreadOnly) list = list.filter((n) => !n.isRead);
    return [...list].sort((a, b) => b.createdTs - a.createdTs);
  }, [notifs, activeTab, showUnreadOnly]);

  const unreadCount = useMemo(() => notifs.filter((n) => !n.isRead).length, [notifs]);
  const tabCount = (tab: TabFilter) =>
    tab === "all"
      ? notifs.filter((n) => !n.isRead).length
      : notifs.filter((n) => n.type === tab && !n.isRead).length;

  async function markRead(id: string) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH", headers: authHeaders() });
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      toast({ type: "error", message: "Failed to mark as read" });
    }
  }

  function markAllRead() {
    openModal({
      variant: "info",
      title: "Mark all as read?",
      description: `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""} will be marked as read.`,
      confirmLabel: "Mark all read",
      onConfirm: async () => {
        try {
          await apiFetch("/api/notifications/read-all", { method: "PATCH", headers: authHeaders() });
          setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
          toast({ type: "success", message: "All notifications marked as read" });
        } catch {
          toast({ type: "error", message: "Failed to mark all as read" });
        }
      },
    });
  }

  function deleteNotif(id: string) {
    const notif = notifs.find((n) => n.id === id);
    openModal({
      variant: "danger",
      title: "Delete notification?",
      description: notif ? `"${notif.title}" will be permanently removed.` : "This notification will be permanently removed.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await apiFetch(`/api/notifications/${id}`, { method: "DELETE", headers: authHeaders() });
          setNotifs((prev) => prev.filter((n) => n.id !== id));
          toast({ type: "info", message: "Notification deleted" });
        } catch {
          toast({ type: "error", message: "Failed to delete notification" });
        }
      },
    });
  }

  function clearRead() {
    const readNotifs = notifs.filter((n) => n.isRead);
    if (readNotifs.length === 0) {
      toast({ type: "info", message: "No read notifications to clear" });
      return;
    }
    Promise.all(
      readNotifs.map((n) =>
        apiFetch(`/api/notifications/${n.id}`, { method: "DELETE", headers: authHeaders() })
      )
    ).then(() => {
      setNotifs((prev) => prev.filter((n) => !n.isRead));
      toast({ type: "success", message: `${readNotifs.length} read notification${readNotifs.length > 1 ? "s" : ""} cleared` });
    }).catch(() => {
      toast({ type: "error", message: "Failed to clear read notifications" });
    });
  }

  return (
    <>
      <SeekerTopbar title="Notifications" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="space-y-4">

          {/* Header bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {unreadCount > 0
                ? <><span className="text-blue-600">{unreadCount} unread</span> · {notifs.length} total</>
                : `${notifs.length} notifications`
              }
            </h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button
                onClick={clearRead}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear read
              </button>
            </div>
          </div>

          {/* Tabs + unread toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {TABS.map(({ id, label }) => {
                const count = tabCount(id);
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                    {count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${activeTab === id ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                showUnreadOnly
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Unread only
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading notifications…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <BellOff className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {showUnreadOnly ? "No unread notifications" : "No notifications here"}
              </p>
              {showUnreadOnly && (
                <button onClick={() => setShowUnreadOnly(false)} className="text-xs text-blue-500 hover:underline mt-1">
                  Show all
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {filtered.map((notif) => {
                const cfg = TYPE_CFG[notif.type] ?? FALLBACK_CFG;
                return (
                  <div
                    key={notif.id}
                    className={`group relative flex gap-3 sm:gap-4 px-4 sm:px-5 py-4 transition-colors ${!notif.isRead ? "bg-blue-50/30" : "hover:bg-slate-50/50"}`}
                  >
                    {!notif.isRead && (
                      <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-blue-500" />
                    )}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${cfg.iconBg}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.isRead && (
                            <button
                              onClick={() => markRead(notif.id)}
                              title="Mark as read"
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotif(notif.id)}
                            title="Delete"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatTime(notif.createdAt)}
                        </span>
                        {notif.actionUrl && /^\//.test(notif.actionUrl) && (
                          <Link
                            href={notif.actionUrl}
                            onClick={() => markRead(notif.id)}
                            className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            View <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
