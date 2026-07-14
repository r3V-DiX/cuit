"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import {
  MapPin, Clock, Search, X, ChevronRight,
  ArrowUpDown, CheckCircle2, Eye, XCircle, Send, Inbox,
} from "lucide-react";
import type { AppStatus } from "./data";
import { apiFetch } from "@/lib/api";

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

type AppListItem = { id: string; role: string; company: string; location: string; type: string; applied: string; status: AppStatus };

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppListItem[]>([]);

  const [activeTab, setActiveTab] = useState<AppStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchApps() {
      try {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", "10");
        params.append("sort", sort);
        if (search.trim()) params.append("search", search.trim());
        if (activeTab !== "All") {
          const labelToApi: Record<string, string> = {
            "Applied": "APPLIED", "Under Review": "UNDER_REVIEW", "Shortlisted": "SHORTLISTED",
            "Rejected": "REJECTED", "Withdrawn": "WITHDRAWN",
          };
          params.append("status", labelToApi[activeTab]);
        }

        const { data } = await apiFetch<{ items?: any[]; meta?: { totalPages?: number; total?: number } }>(`/api/seeker/applications?${params.toString()}`);
        const items = data?.items || [];
        const statusMap: Record<string, AppStatus> = {
          APPLIED: "Applied", UNDER_REVIEW: "Under Review", SHORTLISTED: "Shortlisted",
          REJECTED: "Rejected", WITHDRAWN: "Withdrawn",
        };
        const mapped: AppListItem[] = items.map((a: any) => ({
          id: a.id,
          role: a.job.jobTitle,
          company: a.job.employer.companyName,
          location: a.job.locationType || a.job.location || "Remote",
          type: a.job.jobType || "Full-time",
          applied: new Date(a.appliedAt).toLocaleDateString(),
          status: statusMap[a.status] ?? "Applied",
        }));
        setApps(mapped);
        setTotalPages(data?.meta?.totalPages || 1);
        setTotalCount(data?.meta?.total || 0);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error("Failed to fetch apps", err);
      }
    }
    fetchApps();
  }, [page, sort, search, activeTab]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, sort, activeTab]);

  return (
    <>
      <SeekerTopbar title="Applications" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">

          {/* Summary stats removed as server-side paginated */}

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex gap-1 flex-wrap">
              {TABS.map((tab) => {
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white">
                        {totalCount}
                      </span>
                    )}
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
            {apps.length === 0 ? (
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
                {apps.map((app) => {
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
