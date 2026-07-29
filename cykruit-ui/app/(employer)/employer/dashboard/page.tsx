"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Briefcase, Users, Eye, TrendingUp, ArrowRight, ChevronRight,
  PlusCircle, CheckCircle2, Clock, XCircle, Send, Building2,
  BarChart2, AlertTriangle, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { DashboardListSkeleton } from "@/components/ui/skeletons/ListRowSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import { useKycStatus } from "@/lib/employer-context";

type AppStatus = "New" | "Shortlisted" | "Rejected" | "Interview";

const STATUS_CFG: Record<AppStatus, { color: string; icon: React.ReactNode }> = {
  New:        { color: "text-blue-700 bg-blue-50 border-blue-200",   icon: <Send className="w-3 h-3" />         },
  Shortlisted:{ color: "text-green-700 bg-green-50 border-green-200",icon: <CheckCircle2 className="w-3 h-3" /> },
  Interview:  { color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Clock className="w-3 h-3" />   },
  Rejected:   { color: "text-rose-700 bg-rose-50 border-rose-200",   icon: <XCircle className="w-3 h-3" />     },
};

const STATUS_MAP: Record<string, AppStatus> = {
  PENDING: "New",
  APPLIED: "New",
  UNDER_REVIEW: "New",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  INTERVIEW: "Interview",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

const QUICK_LINKS = [
  { label: "Post a Job",      href: "/employer/jobs/new",   icon: <PlusCircle  className="w-4 h-4" />, requiresKyc: true  },
  { label: "View Applicants", href: "/employer/applicants", icon: <Users       className="w-4 h-4" />, requiresKyc: false },
  { label: "My Jobs",         href: "/employer/jobs",       icon: <Briefcase   className="w-4 h-4" />, requiresKyc: false },
  { label: "Company Profile", href: "/employer/company",    icon: <Building2   className="w-4 h-4" />, requiresKyc: false },
  { label: "Team",            href: "/employer/team",       icon: <Users       className="w-4 h-4" />, requiresKyc: false },
];

interface ApiJob {
  id: string | number;
  jobTitle: string;
  status: string;
  applicantCount?: number;
  viewCount?: number;
  publishedAt?: string | null;
}

interface ApiApplication {
  id: string | number;
  jobId?: string | number;
  job?: { jobTitle?: string };
  jobSeeker?: { firstName?: string; lastName?: string };
  status: string;
  appliedAt: string;
}

export default function EmployerDashboardPage() {
  const [displayName, setDisplayName] = useState("Employer");
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const kycCtx = useKycStatus();
  const verificationStatus =
    kycCtx === "verified"      ? "APPROVED"     :
    kycCtx === "pending"       ? "PENDING"      :
    kycCtx === "under_review"  ? "UNDER_REVIEW" :
    kycCtx === "rejected"      ? "REJECTED"     :
    "NOT_SUBMITTED";

  useEffect(() => {
    async function fetchUser() {
      try {
        const result = await apiFetch<{ firstName?: string }>("/api/auth/me");
        if (result.data?.firstName) {
          setDisplayName(result.data.firstName);
        }
      } catch {
        // Silent catch for guest fallback
      }
    }
    fetchUser();
  }, []);

  const [activeJobsCount, setActiveJobsCount] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(false);
      try {
        const [jobsData, appsData] = await Promise.all([
          apiFetch<{ items: ApiJob[] } | ApiJob[]>("/api/employer/jobs").catch(() => ({ data: { items: [] as ApiJob[] } })),
          apiFetch<{ items: ApiApplication[] } | ApiApplication[]>("/api/employer/applications").catch(() => ({ data: { items: [] as ApiApplication[] } })),
        ]);
        const jobsRaw = jobsData.data;
        const jobsArr: ApiJob[] = Array.isArray(jobsRaw) ? jobsRaw : (jobsRaw?.items ?? []);
        const appsRaw = appsData.data;
        const appsArr: ApiApplication[] = Array.isArray(appsRaw) ? appsRaw : (appsRaw?.items ?? []);
        setJobs(jobsArr);
        setApplications(appsArr);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
    // "Active Jobs" is a true total, not just among the recent jobs fetched above —
    // needs the real aggregate, not a tally over whatever page size /employer/jobs returns.
    apiFetch<{ active: number }>("/api/employer/jobs/counts")
      .then((res) => { if (res.data) setActiveJobsCount(res.data.active); })
      .catch(() => null);
  }, []);
  const totalApplicants = applications.length;
  const newThisWeek = applications.filter(a => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(a.appliedAt).getTime() >= weekAgo;
  }).length;
  const totalViews = jobs.reduce((sum, j) => sum + (j.viewCount || 0), 0);

  // Recent applicants: last 4 by appliedAt desc
  const recentApplicants = [...applications]
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 4)
    .map(a => ({
      id: a.id,
      name: `${a.jobSeeker?.firstName ?? ""} ${a.jobSeeker?.lastName ?? ""}`.trim() || "Unknown",
      role: a.job?.jobTitle ?? "—",
      status: (STATUS_MAP[a.status] ?? "New") as AppStatus,
      time: relativeTime(a.appliedAt),
    }));

  // Jobs list: sorted by publishedAt desc
  const jobsList = [...jobs]
    .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())
    .map(j => ({
      id: j.id,
      title: j.jobTitle,
      applicants: j.applicantCount ?? 0,
      views: j.viewCount ?? 0,
      posted: relativeTime(j.publishedAt),
      status: j.status === "APPROVED" ? "Active" :
              j.status === "PENDING" ? "Pending" :
              j.status === "DRAFT" ? "Draft" :
              j.status === "CLOSED" ? "Closed" : "Rejected",
    }));

  // Hiring funnel counts
  const funnelTotal = applications.length;
  const funnelShortlisted = applications.filter(a => a.status === "SHORTLISTED").length;
  const funnelInterview = applications.filter(a => a.status === "INTERVIEW").length;
  const funnelOffer = applications.filter(a => a.status === "OFFER_SENT" || a.status === "OFFERED").length;

  const canPost = verificationStatus === "APPROVED";
  const statVal = (val: number) => (loading ? null : error ? "—" : val);

  return (
    <>
      <EmployerTopbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="flex flex-col gap-5">

          {/* Verification banner */}
          {verificationStatus === "NOT_SUBMITTED" && (
            <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">KYC verification required</p>
                <p className="text-xs text-amber-700 mt-0.5">Complete your organization setup and submit KYC to post jobs.</p>
              </div>
              <Link href="/kyc/employer" className="shrink-0 h-8 px-3 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors flex items-center">
                Complete KYC
              </Link>
            </div>
          )}
          {(verificationStatus === "PENDING" || verificationStatus === "UNDER_REVIEW") && (
            <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-800">Verification under review</p>
                <p className="text-xs text-blue-700 mt-0.5">Your KYC documents are being reviewed. Job posting will unlock once approved (1–2 business days).</p>
              </div>
            </div>
          )}
          {verificationStatus === "REJECTED" && (
            <div className="flex items-start gap-3 px-5 py-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-rose-800">Verification rejected</p>
                <p className="text-xs text-rose-700 mt-0.5">Your KYC was rejected. Please resubmit with correct documents.</p>
              </div>
              <Link href="/kyc/employer" className="shrink-0 h-8 px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center">
                Resubmit
              </Link>
            </div>
          )}
          {verificationStatus === "APPROVED" && (
            <div className="flex items-center gap-3 px-5 py-3.5 bg-green-50 border border-green-200 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm font-semibold text-green-800">Organization verified</p>
            </div>
          )}

          {/* Greeting */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">{getGreeting()}, {displayName}</h1>
              <p className="text-sm text-slate-500 mt-0.5">Here&apos;s your hiring overview for today</p>
            </div>
            {canPost ? (
              <Link
                href="/employer/jobs/new"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 shrink-0"
              >
                <PlusCircle className="w-4 h-4" /> Post a Job
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed shrink-0 select-none" title="Complete KYC verification to post jobs">
                <PlusCircle className="w-4 h-4" /> Post a Job
              </div>
            )}
          </div>

          {/* Quick Links — below greeting */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {QUICK_LINKS.map(({ label, href, icon, requiresKyc }) => {
              const locked = requiresKyc && !canPost;
              return locked ? (
                <div
                  key={href}
                  title="Complete KYC to unlock"
                  className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl border border-slate-200 bg-white text-slate-300 cursor-not-allowed select-none"
                >
                  <span>{icon}</span>
                  <span className="text-[11px] font-medium text-center leading-snug">{label}</span>
                </div>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                >
                  <span className="text-slate-400 group-hover:text-blue-500 transition-colors">{icon}</span>
                  <span className="text-[11px] font-medium text-center leading-snug">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Active Jobs",       value: statVal(activeJobsCount),  href: "/employer/jobs",       iconBg: "bg-blue-50 text-blue-600",    numColor: "text-blue-600",   icon: <Briefcase   className="w-5 h-5" /> },
              { label: "Total Applicants",  value: statVal(totalApplicants),  href: "/employer/applicants", iconBg: "bg-violet-50 text-violet-600", numColor: "text-violet-600", icon: <Users       className="w-5 h-5" /> },
              { label: "New This Week",     value: statVal(newThisWeek),      href: "/employer/applicants", iconBg: "bg-green-50 text-green-600",  numColor: "text-green-600",  icon: <TrendingUp  className="w-5 h-5" /> },
              { label: "Total Views",       value: statVal(totalViews),       href: "/employer/jobs",       iconBg: "bg-amber-50 text-amber-600",  numColor: "text-amber-600",  icon: <Eye         className="w-5 h-5" /> },
            ].map(({ label, value, href, iconBg, numColor, icon }) => (
              <Link
                key={label}
                href={href}
                className="bg-white rounded-2xl border border-slate-200 px-4 py-4 flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div>
                  {loading
                    ? <Skeleton className="h-7 w-10 mb-1" />
                    : <p className={`text-2xl font-bold leading-none ${numColor}`}>{value}</p>
                  }
                  <p className="text-xs text-slate-600 font-medium mt-1.5">{label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  {icon}
                </div>
              </Link>
            ))}
          </div>

          {/* Row 1: Recent Applicants + Hiring Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Recent Applicants */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-900">Recent Applicants</h2>
                </div>
                <Link href="/employer/applicants" className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-2">
                    <DashboardListSkeleton count={4} />
                  </div>
                ) : recentApplicants.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No applicants yet</p>
                ) : recentApplicants.map((a) => {
                  const cfg = STATUS_CFG[a.status];
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 transition-colors">
                          {a.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{a.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{a.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        <span className="hidden sm:block text-[10px] font-mono text-slate-400">{a.time}</span>
                        <span className={`flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                          {cfg.icon}<span className="hidden sm:inline">{a.status}</span>
                        </span>
                        <Link href={`/employer/applicants/${a.id}`} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors">
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hiring Funnel */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Hiring Funnel</h2>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-6" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))
                ) : (
                  [
                    { label: "Total Applied",  count: funnelTotal,       pct: 100,                                                                  color: "bg-blue-500"   },
                    { label: "Shortlisted",    count: funnelShortlisted, pct: funnelTotal ? Math.round(funnelShortlisted / funnelTotal * 100) : 0,  color: "bg-violet-500" },
                    { label: "Interview",      count: funnelInterview,   pct: funnelTotal ? Math.round(funnelInterview   / funnelTotal * 100) : 0,  color: "bg-amber-500"  },
                    { label: "Offer Sent",     count: funnelOffer,       pct: funnelTotal ? Math.round(funnelOffer       / funnelTotal * 100) : 0,  color: "bg-green-500"  },
                  ].map(({ label, count, pct, color }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600 font-medium">{label}</span>
                        <span className="text-xs font-bold text-slate-900 font-mono">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link
                href="/employer/applicants"
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all"
              >
                View all applicants <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          {/* Row 2: Active Job Listings */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Active Job Listings</h2>
              </div>
              <Link href="/employer/jobs" className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Manage all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-2">
                  <DashboardListSkeleton count={3} />
                </div>
              ) : jobsList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No jobs posted yet</p>
              ) : jobsList.map((job) => (
                <div key={job.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                        job.status === "Active"
                          ? "text-green-700 bg-green-50 border-green-200"
                          : job.status === "Pending"
                          ? "text-amber-700 bg-amber-50 border-amber-200"
                          : job.status === "Closed" || job.status === "Draft"
                          ? "text-slate-500 bg-slate-50 border-slate-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">Posted {job.posted}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-xs text-slate-500">
                    <span className="hidden sm:flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-300" />{job.applicants}</span>
                    <span className="hidden sm:flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-slate-300" />{job.views}</span>
                    <Link href={`/employer/jobs/${job.id}/edit`} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors">
                      Edit <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
