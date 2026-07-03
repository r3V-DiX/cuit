"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import {
  Bell, BellOff, CheckCheck, Trash2, X,
  Briefcase, Sparkles, Eye, Shield, ChevronRight,
  CheckCircle2, XCircle, Clock, Send, Inbox,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = "application" | "job_match" | "profile_view" | "system";

type Notification = {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  timeTs: number;
  read: boolean;
  link?: string;
  meta?: string; // company name, job title etc.
};

// ─── Seed ─────────────────────────────────────────────────────────────────────

const SEED: Notification[] = [
  {
    id: 1,
    type: "application",
    title: "You've been shortlisted!",
    body: "CrowdStrike moved your application for Senior Penetration Tester to the shortlist. A recruiter may reach out soon.",
    time: "2h ago",
    timeTs: Date.now() - 2 * 3600000,
    read: false,
    link: "/applications",
    meta: "CrowdStrike",
  },
  {
    id: 2,
    type: "job_match",
    title: "New job match: Red Team Lead",
    body: "Microsoft posted a Red Team Lead role that matches your profile — OSCP, Red Team, Python. 92% match score.",
    time: "5h ago",
    timeTs: Date.now() - 5 * 3600000,
    read: false,
    link: "/jobs/9",
    meta: "Microsoft · Remote",
  },
  {
    id: 3,
    type: "profile_view",
    title: "A recruiter viewed your profile",
    body: "Someone from Mandiant viewed your profile. Make sure your profile is complete to stand out.",
    time: "Yesterday",
    timeTs: Date.now() - 26 * 3600000,
    read: false,
    link: "/profile",
    meta: "Mandiant",
  },
  {
    id: 4,
    type: "application",
    title: "Application under review",
    body: "Palo Alto Networks is reviewing your application for Cloud Security Engineer. You'll hear back within 5–7 business days.",
    time: "2d ago",
    timeTs: Date.now() - 2 * 86400000,
    read: true,
    link: "/applications",
    meta: "Palo Alto Networks",
  },
  {
    id: 5,
    type: "job_match",
    title: "3 new jobs match your profile",
    body: "Okta, Zscaler, and IBM Security posted roles matching Offensive Security and Cloud Security in your preferred locations.",
    time: "2d ago",
    timeTs: Date.now() - 2.5 * 86400000,
    read: false,
    link: "/jobs",
    meta: "3 new matches",
  },
  {
    id: 6,
    type: "system",
    title: "Complete your profile to get more matches",
    body: "Your profile is 72% complete. Add your education and portfolio link to improve your visibility to recruiters by 3×.",
    time: "3d ago",
    timeTs: Date.now() - 3 * 86400000,
    read: true,
    link: "/profile",
  },
  {
    id: 7,
    type: "application",
    title: "Application not selected",
    body: "Stripe has decided not to move forward with your application for AppSec Engineer. Keep applying — the right role is out there.",
    time: "4d ago",
    timeTs: Date.now() - 4 * 86400000,
    read: true,
    link: "/applications",
    meta: "Stripe",
  },
  {
    id: 8,
    type: "profile_view",
    title: "Your profile is gaining traction",
    body: "5 recruiters viewed your profile this week — up 2× from last week. Your OSCP certification is a top search term.",
    time: "5d ago",
    timeTs: Date.now() - 5 * 86400000,
    read: true,
  },
  {
    id: 9,
    type: "system",
    title: "New feature: AI job matching",
    body: "We've launched AI-powered job matching. Your profile is now automatically matched to new roles as they're posted.",
    time: "1w ago",
    timeTs: Date.now() - 7 * 86400000,
    read: true,
  },
  {
    id: 10,
    type: "job_match",
    title: "Saved job expiring soon",
    body: "The AppSec Engineer role at Stripe you saved is closing in 2 days. Apply before the deadline.",
    time: "1w ago",
    timeTs: Date.now() - 8 * 86400000,
    read: true,
    link: "/saved",
    meta: "Stripe · Hybrid · SF",
  },
];

// ─── Config per type ──────────────────────────────────────────────────────────

type TabFilter = "all" | NotifType;

const TYPE_CFG: Record<NotifType, {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
}> = {
  application: {
    icon: <Briefcase className="w-4 h-4" />,
    iconBg: "bg-blue-50 text-blue-600 border-blue-100",
    label: "Applications",
  },
  job_match: {
    icon: <Sparkles className="w-4 h-4" />,
    iconBg: "bg-violet-50 text-violet-600 border-violet-100",
    label: "Job Matches",
  },
  profile_view: {
    icon: <Eye className="w-4 h-4" />,
    iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    label: "Profile Activity",
  },
  system: {
    icon: <Shield className="w-4 h-4" />,
    iconBg: "bg-slate-100 text-slate-500 border-slate-200",
    label: "System",
  },
};

const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "application", label: "Applications" },
  { id: "job_match", label: "Job Matches" },
  { id: "profile_view", label: "Profile" },
  { id: "system", label: "System" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { toast } = useToast();
  const { openModal } = useModal();

  const [notifs, setNotifs] = useState<Notification[]>(SEED);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = notifs;
    if (activeTab !== "all") list = list.filter((n) => n.type === activeTab);
    if (showUnreadOnly) list = list.filter((n) => !n.read);
    return list.sort((a, b) => b.timeTs - a.timeTs);
  }, [notifs, activeTab, showUnreadOnly]);

  const unreadCount = useMemo(() => notifs.filter((n) => !n.read).length, [notifs]);

  const tabCount = (tab: TabFilter) =>
    tab === "all"
      ? notifs.filter((n) => !n.read).length
      : notifs.filter((n) => n.type === tab && !n.read).length;

  // ── Actions ───────────────────────────────────────────────────────────────────
  function markRead(id: number) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    openModal({
      variant: "info",
      title: "Mark all as read?",
      description: `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""} will be marked as read.`,
      confirmLabel: "Mark all read",
      onConfirm: () => {
        setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
        toast({ type: "success", message: "All notifications marked as read" });
      },
    });
  }

  function deleteNotif(id: number) {
    const notif = notifs.find((n) => n.id === id);
    openModal({
      variant: "danger",
      title: "Delete notification?",
      description: notif ? `"${notif.title}" will be permanently removed.` : "This notification will be permanently removed.",
      confirmLabel: "Delete",
      onConfirm: () => {
        setNotifs((prev) => prev.filter((n) => n.id !== id));
        toast({ type: "info", message: "Notification deleted" });
      },
    });
  }

  function clearAll() {
    openModal({
      variant: "danger",
      title: "Clear all notifications?",
      description: "All notifications will be permanently removed.",
      confirmLabel: "Clear all",
      onConfirm: () => {
        setNotifs([]);
        toast({ type: "info", message: "All notifications cleared" });
      },
    });
  }

  function clearRead() {
    const count = notifs.filter((n) => n.read).length;
    if (count === 0) {
      toast({ type: "info", message: "No read notifications to clear" });
      return;
    }
    setNotifs((prev) => prev.filter((n) => !n.read));
    toast({ type: "success", message: `${count} read notification${count > 1 ? "s" : ""} cleared` });
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <SeekerTopbar title="Notifications" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">

          {/* Header bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-900">
                {unreadCount > 0
                  ? <><span className="text-blue-600">{unreadCount} unread</span> · {notifs.length} total</>
                  : `${notifs.length} notifications`
                }
              </h2>
            </div>
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

          {/* Notification list */}
          {filtered.length === 0 ? (
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
                const cfg = TYPE_CFG[notif.type];
                return (
                  <div
                    key={notif.id}
                    className={`group relative flex gap-4 px-5 py-4 transition-colors ${!notif.read ? "bg-blue-50/30" : "hover:bg-slate-50/50"}`}
                  >
                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-blue-500" />
                    )}

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${cfg.iconBg}`}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!notif.read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                          {notif.title}
                        </p>
                        {/* Actions: appear on hover */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.read && (
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

                      {notif.meta && (
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{notif.meta}</p>
                      )}

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.body}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {notif.time}
                        </span>

                        {notif.link && (
                          <Link
                            href={notif.link}
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

          {/* Clear all at bottom */}
          {notifs.length > 0 && (
            <div className="flex justify-center pt-1">
              <button
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear all notifications
              </button>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
