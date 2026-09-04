"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart2, Eye, Users, TrendingUp, Briefcase,
  ArrowUpRight, Lock, Zap, CheckCircle2, Clock, XCircle, Send, Sparkles, Minus,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSubscriptionLimits } from "@/lib/use-subscription-limits";
import { useInlineStyle } from "@/lib/use-inline-style";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import { Skeleton } from "@/components/ui/Skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TopJob {
  id: string;
  jobTitle: string;
  viewCount: number;
  applicationCount: number;
}

interface StatusCounts {
  active: number;
  pending: number;
  draft: number;
  closed: number;
}

interface AnalyticsSummary {
  totalJobs: number;
  totalViews: number;
  totalApplications: number;
  conversionRate: number;
  statusCounts: StatusCounts;
  applicationStatusBreakdown: Record<string, number>;
  topJobs: TopJob[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const APP_STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  APPLIED:      { label: "Applied",      color: "bg-blue-100 text-blue-700",   icon: <Send className="w-3 h-3" />          },
  UNDER_REVIEW: { label: "Under Review", color: "bg-amber-100 text-amber-700", icon: <Eye className="w-3 h-3" />           },
  SHORTLISTED:  { label: "Shortlisted",  color: "bg-teal-100 text-teal-700",   icon: <Sparkles className="w-3 h-3" />      },
  REJECTED:     { label: "Rejected",     color: "bg-rose-100 text-rose-700",   icon: <XCircle className="w-3 h-3" />       },
  WITHDRAWN:    { label: "Withdrawn",    color: "bg-slate-100 text-slate-600", icon: <Minus className="w-3 h-3" />         },
};

function pct(val: number, total: number) {
  if (total === 0) return 0;
  return Math.round((val / total) * 100);
}

// ── Upgrade wall ──────────────────────────────────────────────────────────────

function UpgradeWall() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
        <Lock className="w-8 h-8 text-violet-500" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Analytics is a paid feature</h2>
        <p className="text-sm text-slate-500">
          Upgrade to the Growth plan to see job performance, application funnels, and hiring insights.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {["Job views & application rates", "Application status breakdown", "Top performing jobs", "Usage vs plan limits"].map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
            <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            {f}
          </div>
        ))}
      </div>
      <Link
        href="/employer/subscription?tab=plans"
        className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
      >
        View Plans →
      </Link>
    </div>
  );
}

// ── Progress bar (width is runtime-computed, applied via CSSOM — see use-inline-style) ──

function ProgressBar({ pct, className }: { pct: number; className: string }) {
  const ref = useInlineStyle<HTMLDivElement>({ width: `${pct}%` });
  return <div ref={ref} className={className} />;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-8 w-full mb-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { limits, usage, loading: limitsLoading } = useSubscriptionLimits();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const analyticsEnabled = limits?.analyticsEnabled ?? false;

  useEffect(() => {
    if (limitsLoading) return;
    if (!analyticsEnabled) { setLoading(false); return; }

    apiFetch<AnalyticsSummary>("/api/employer/analytics")
      .then((res) => setSummary(res.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [analyticsEnabled, limitsLoading]);

  // ── Derived stats ────────────────────────────────────────────────────────

  const totalViews = summary?.totalViews ?? 0;
  const totalApps = summary?.totalApplications ?? 0;
  const conversionRate = (summary?.conversionRate ?? 0).toFixed(1);
  const appStatusTotals = summary?.applicationStatusBreakdown ?? {};
  const statusCounts = summary?.statusCounts ?? null;
  const topJobs = summary?.topJobs ?? [];

  return (
    <>
      <EmployerTopbar title="Analytics" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        {(loading || limitsLoading) ? (
          <AnalyticsSkeleton />
        ) : !analyticsEnabled ? (
          <UpgradeWall />
        ) : (
          <div className="flex flex-col gap-5 max-w-6xl">

            {/* ── Summary cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Views",       value: totalViews,                            icon: <Eye className="w-5 h-5 text-blue-500" />,   color: "bg-blue-50"   },
                { label: "Applications",      value: totalApps,                             icon: <Users className="w-5 h-5 text-violet-500" />, color: "bg-violet-50" },
                { label: "Conversion Rate",   value: `${conversionRate}%`,                  icon: <TrendingUp className="w-5 h-5 text-green-500" />, color: "bg-green-50" },
                { label: "Active Jobs",       value: statusCounts?.active ?? 0,             icon: <Briefcase className="w-5 h-5 text-amber-500" />, color: "bg-amber-50" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                    {icon}
                  </div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* ── Application status breakdown ──────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Application Funnel</h2>
                {totalApps === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No applications yet</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {Object.entries(APP_STATUS_CFG).map(([key, cfg]) => {
                      const count = appStatusTotals[key] ?? 0;
                      const fraction = pct(count, totalApps);
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                                {cfg.icon}{cfg.label}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-700">{count} <span className="text-slate-400 font-normal">({fraction}%)</span></span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <ProgressBar pct={fraction} className="h-full bg-blue-500 rounded-full transition-all duration-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Job status breakdown ──────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Job Status Overview</h2>
                {!statusCounts ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No data</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Active",  value: statusCounts.active,  color: "bg-green-50 border-green-200",  text: "text-green-700"  },
                      { label: "Pending", value: statusCounts.pending, color: "bg-amber-50 border-amber-200",  text: "text-amber-700"  },
                      { label: "Draft",   value: statusCounts.draft,   color: "bg-slate-50 border-slate-200",  text: "text-slate-600"  },
                      { label: "Closed",  value: statusCounts.closed,  color: "bg-rose-50 border-rose-200",    text: "text-rose-700"   },
                    ].map(({ label, value, color, text }) => (
                      <div key={label} className={`rounded-xl border p-4 ${color}`}>
                        <p className={`text-2xl font-bold ${text}`}>{value}</p>
                        <p className={`text-xs font-medium mt-0.5 ${text} opacity-80`}>{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Usage vs limits */}
                {limits && usage && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan Usage</p>
                    {[
                      { label: "Active Jobs",    used: usage.currentActiveJobs,  max: limits.maxActiveJobs  },
                      { label: "Team Members",   used: usage.currentTeamMembers, max: limits.maxTeamMembers },
                    ].map(({ label, used, max }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">{label}</span>
                          <span className="font-bold text-slate-700">{used} / {max}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <ProgressBar
                            pct={Math.min(pct(used, max), 100)}
                            className={`h-full rounded-full transition-all duration-500 ${pct(used, max) >= 90 ? "bg-rose-500" : "bg-blue-500"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Top performing jobs ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Top Performing Jobs</h2>
                <Link href="/employer/jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  All Jobs <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {topJobs.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No active jobs yet</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* Header row */}
                  <div className="grid grid-cols-12 px-5 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    <span className="col-span-5">Job Title</span>
                    <span className="col-span-2 text-right">Views</span>
                    <span className="col-span-2 text-right">Apps</span>
                    <span className="col-span-3 text-right">Rate</span>
                  </div>
                  {topJobs.map((job) => {
                    const rate = job.viewCount > 0
                      ? ((job.applicationCount / job.viewCount) * 100).toFixed(1)
                      : "0.0";
                    return (
                      <div key={job.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-5">
                          <Link
                            href={`/employer/jobs/${job.id}`}
                            className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {job.jobTitle}
                          </Link>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1 text-sm text-slate-600">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          {job.viewCount}
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1 text-sm text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {job.applicationCount}
                        </div>
                        <div className="col-span-3 text-right">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            parseFloat(rate) >= 10
                              ? "bg-green-100 text-green-700"
                              : parseFloat(rate) >= 3
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {rate}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </>
  );
}
