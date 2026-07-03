"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import {
  MapPin, Clock, Search, X, ChevronRight,
  ArrowUpDown, CheckCircle2, Eye, XCircle, Send, Inbox,
} from "lucide-react";
import type { AppStatus } from "./data";
import { SEED } from "./data";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<AppStatus, { color: string; icon: React.ReactNode; dot: string }> = {
  Applied:        { color: "text-blue-700 bg-blue-50 border-blue-200",     icon: <Send className="w-3 h-3" />,         dot: "bg-blue-500" },
  "Under Review": { color: "text-amber-700 bg-amber-50 border-amber-200",  icon: <Eye className="w-3 h-3" />,          dot: "bg-amber-400" },
  Shortlisted:    { color: "text-green-700 bg-green-50 border-green-200",  icon: <CheckCircle2 className="w-3 h-3" />, dot: "bg-green-500" },
  Rejected:       { color: "text-red-700 bg-red-50 border-red-200",        icon: <XCircle className="w-3 h-3" />,      dot: "bg-red-400" },
  Withdrawn:      { color: "text-slate-500 bg-slate-100 border-slate-200", icon: <X className="w-3 h-3" />,            dot: "bg-slate-400" },
};

const TABS: (AppStatus | "All")[] = ["All", "Applied", "Under Review", "Shortlisted", "Rejected", "Withdrawn"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const apps = SEED;
  const [activeTab, setActiveTab] = useState<AppStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const filtered = useMemo(() => {
    let list = apps;
    if (activeTab !== "All") list = list.filter((a) => a.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.role.toLowerCase().includes(q) || a.company.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const da = new Date(a.applied).getTime();
      const db = new Date(b.applied).getTime();
      return sort === "newest" ? db - da : da - db;
    });
  }, [apps, activeTab, search, sort]);

  const counts = useMemo(() => ({
    total: apps.length,
    shortlisted: apps.filter((a) => a.status === "Shortlisted").length,
    underReview: apps.filter((a) => a.status === "Under Review").length,
    rejected: apps.filter((a) => a.status === "Rejected").length,
  }), [apps]);

  return (
    <>
      <SeekerTopbar title="Applications" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">

          {/* Summary stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Total applied",  value: counts.total,       color: "text-slate-700 bg-white border-slate-200",         tab: "All" as const },
              { label: "Shortlisted",    value: counts.shortlisted,  color: "text-green-700 bg-green-50 border-green-200",       tab: "Shortlisted" as const },
              { label: "Under Review",   value: counts.underReview,  color: "text-amber-700 bg-amber-50 border-amber-200",       tab: "Under Review" as const },
              { label: "Rejected",       value: counts.rejected,     color: "text-red-700 bg-red-50 border-red-200",             tab: "Rejected" as const },
            ].map(({ label, value, color, tab }) => (
              <button
                key={label}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80 ${color} ${activeTab === tab ? "ring-2 ring-offset-1 ring-current" : ""}`}
              >
                <span className="font-bold text-base leading-none">{value}</span>
                <span className="text-xs font-normal opacity-70">{label}</span>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex gap-1 flex-wrap">
              {TABS.map((tab) => {
                const count = tab === "All" ? apps.length : apps.filter((a) => a.status === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {tab}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${activeTab === tab ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by role or company…"
                  className="w-full h-9 pl-9 pr-9 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sort === "newest" ? "Newest first" : "Oldest first"}
              </button>
            </div>
          </div>

          {/* Application rows */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No applications found</p>
                {(search || activeTab !== "All") && (
                  <button onClick={() => { setSearch(""); setActiveTab("All"); }} className="mt-2 text-xs text-blue-500 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((app) => {
                  const cfg = STATUS_CFG[app.status];
                  return (
                    <Link
                      key={app.id}
                      href={`/applications/${app.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 transition-colors">
                          {app.company[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{app.role}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 flex-wrap">
                            <span>{app.company}</span>
                            <span>·</span>
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{app.location}</span>
                            <span>·</span>
                            <span className="font-mono">{app.type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {app.applied}
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                          {cfg.icon}{app.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
