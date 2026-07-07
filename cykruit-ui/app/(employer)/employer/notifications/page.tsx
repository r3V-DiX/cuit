"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  CheckCheck, Users, Briefcase, AlertCircle, Info, Bell,
  ChevronRight, Trash2,
} from "lucide-react";

type NotifType = "applicant" | "job" | "system" | "alert";

const TYPE_CFG: Record<NotifType, { icon: React.ReactNode; color: string; label: string }> = {
  applicant: { icon: <Users       className="w-4 h-4" />, color: "bg-blue-50 text-blue-600 border-blue-200",     label: "Applicant" },
  job:       { icon: <Briefcase   className="w-4 h-4" />, color: "bg-violet-50 text-violet-600 border-violet-200",label: "Job"       },
  system:    { icon: <Info        className="w-4 h-4" />, color: "bg-slate-100 text-slate-500 border-slate-200",  label: "System"    },
  alert:     { icon: <AlertCircle className="w-4 h-4" />, color: "bg-amber-50 text-amber-600 border-amber-200",  label: "Alert"     },
};

const INITIAL_NOTIFS: {
  id: number; type: NotifType; title: string; body: string;
  time: string; read: boolean; href?: string;
}[] = [
  { id: 1, type: "applicant", title: "New application received",       body: "Aryan Mehta applied for Senior Penetration Tester.",               time: "2h ago",  read: false, href: "/employer/applicants/1" },
  { id: 2, type: "applicant", title: "New application received",       body: "Neha Kulkarni applied for Senior Penetration Tester.",             time: "4h ago",  read: false, href: "/employer/applicants/4" },
  { id: 3, type: "job",       title: "Job listing approved",           body: "Your job 'Cloud Security Engineer' is now live and visible.",      time: "6h ago",  read: false, href: "/employer/jobs"         },
  { id: 4, type: "applicant", title: "Applicant shortlisted",          body: "Priya Sharma was moved to Shortlisted for Cloud Security Engineer.",time: "1d ago", read: true,  href: "/employer/applicants/2" },
  { id: 5, type: "alert",     title: "Job expiring soon",              body: "'Red Team Operator' expires in 3 days. Renew to keep it live.",    time: "1d ago",  read: true,  href: "/employer/jobs"         },
  { id: 6, type: "system",    title: "Profile verification complete",  body: "Your company profile has been verified by the Cykruit team.",     time: "3d ago",  read: true                                   },
  { id: 7, type: "applicant", title: "New application received",       body: "Vikram Singh applied for Red Team Operator.",                     time: "4d ago",  read: true,  href: "/employer/applicants/5" },
  { id: 8, type: "job",       title: "Job reached 100 views",          body: "Senior Penetration Tester has reached 100 profile views.",        time: "5d ago",  read: true,  href: "/employer/jobs"         },
  { id: 9, type: "system",    title: "Weekly hiring report ready",     body: "Your week ending Jun 20 summary: 9 new applicants, 340 views.",   time: "6d ago",  read: true                                   },
];

type Filter = "all" | "unread" | NotifType;
const FILTER_OPTIONS: { id: Filter; label: string }[] = [
  { id: "all",       label: "All"       },
  { id: "unread",    label: "Unread"    },
  { id: "applicant", label: "Applicants"},
  { id: "job",       label: "Jobs"      },
  { id: "alert",     label: "Alerts"    },
  { id: "system",    label: "System"    },
];

export default function EmployerNotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const local = localStorage.getItem("cykruit_employer_notifications");
    if (local) {
      setNotifs(JSON.parse(local));
    } else {
      localStorage.setItem("cykruit_employer_notifications", JSON.stringify(INITIAL_NOTIFS));
      setNotifs(INITIAL_NOTIFS);
    }
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifs((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem("cykruit_employer_notifications", JSON.stringify(next));
      return next;
    });
  }
  function markRead(id: number) {
    setNotifs((prev) => {
      const next = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem("cykruit_employer_notifications", JSON.stringify(next));
      return next;
    });
  }
  function dismiss(id: number) {
    setNotifs((prev) => {
      const next = prev.filter((n) => n.id !== id);
      localStorage.setItem("cykruit_employer_notifications", JSON.stringify(next));
      return next;
    });
  }

  const shown = notifs.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "all") return true;
    return n.type === filter;
  });

  return (
    <>
      <EmployerTopbar title="Notifications" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

          {/* ── Left: notification list ─────────────────────────────────────── */}
          <div className="xl:col-span-2">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex-wrap">
                {FILTER_OPTIONS.map((f) => (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      filter === f.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {f.label}
                    {f.id === "unread" && unreadCount > 0 && (
                      <span className="ml-1.5 text-[10px] bg-white/25 px-1 rounded">{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {shown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                <Bell className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium text-sm">You're all caught up</p>
                <p className="text-xs text-slate-400 mt-1">No notifications to show</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
                {shown.map((n) => {
                  const cfg = TYPE_CFG[n.type as NotifType];
                  const Inner = (
                    <div className={`flex items-start gap-4 px-5 py-4 transition-colors group ${!n.read ? "bg-blue-50/40" : "hover:bg-slate-50/60"}`}>
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</p>
                            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-slate-400">{n.time}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); dismiss(n.id); }}
                              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                        {n.href && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 mt-1.5">
                            View <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
                    </div>
                  );

                  return n.href ? (
                    <Link key={n.id} href={n.href} onClick={() => markRead(n.id)} className="block">
                      {Inner}
                    </Link>
                  ) : (
                    <div key={n.id} onClick={() => markRead(n.id)} className="cursor-default">
                      {Inner}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs font-mono text-slate-400 mt-3">{shown.length} notification{shown.length !== 1 ? "s" : ""}</p>
          </div>

          {/* ── Right: sidebar summary ──────────────────────────────────────── */}
          <div className="xl:col-span-1 flex flex-col gap-4 sticky top-6">

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Summary</h3>
              <div className="space-y-3">
                {(["applicant", "job", "alert", "system"] as NotifType[]).map((t) => {
                  const cfg   = TYPE_CFG[t];
                  const count = notifs.filter((n) => n.type === t).length;
                  const unread = notifs.filter((n) => n.type === t && !n.read).length;
                  return (
                    <button key={t} onClick={() => setFilter(t)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                        filter === t ? "border-blue-200 bg-blue-50" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-700">{cfg.label}</p>
                        <p className="text-[10px] text-slate-400">{count} total</p>
                      </div>
                      {unread > 0 && (
                        <span className="text-[10px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-full">{unread}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification settings link */}
            <Link href="/employer/settings"
              className="flex items-center justify-between gap-3 px-5 py-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
              <div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">Notification Preferences</p>
                <p className="text-xs text-slate-400 mt-0.5">Manage what alerts you receive</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
