"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  PlusCircle, Eye, Users, Edit3, Trash2, Search,
  Briefcase, CheckCircle2, Clock, XCircle,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders, describeError } from "@/lib/api";
import { useKycStatus } from "@/lib/employer-context";
import { KycGate } from "@/components/employer/KycGate";
import { JobTableSkeleton } from "@/components/ui/skeletons/ListRowSkeleton";

const JOBS_PER_PAGE = 10;

type JobDisplayStatus = "Active" | "Pending" | "Draft" | "Closed" | "Rejected" | "Expired";

const STATUS_CFG: Record<JobDisplayStatus, { color: string; icon: React.ReactNode }> = {
  Active:   { color: "text-green-700 bg-green-50 border-green-200",  icon: <CheckCircle2 className="w-3 h-3" /> },
  Pending:  { color: "text-amber-700 bg-amber-50 border-amber-200",  icon: <Clock        className="w-3 h-3" /> },
  Draft:    { color: "text-slate-500 bg-slate-50 border-slate-200",  icon: <Clock        className="w-3 h-3" /> },
  Closed:   { color: "text-rose-700 bg-rose-50 border-rose-200",     icon: <XCircle      className="w-3 h-3" /> },
  Rejected: { color: "text-rose-700 bg-rose-50 border-rose-200",     icon: <XCircle      className="w-3 h-3" /> },
  Expired:  { color: "text-slate-700 bg-slate-50 border-slate-200",  icon: <XCircle      className="w-3 h-3" /> },
};

const STATUS_FILTERS = ["All", "Active", "Pending", "Draft", "Closed", "Rejected"] as const;
type StatusFilterType = typeof STATUS_FILTERS[number];

interface Job {
  id: string;
  title: string;
  domain: string;
  type: string;
  location: string;
  applicants: number;
  views: number;
  posted: string;
  status: JobDisplayStatus;
}

export default function MyJobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const kycStatus = useKycStatus();
  const isVerified = kycStatus === "verified";

  const [counts, setCounts] = useState({ active: 0, pending: 0, draft: 0, closed: 0 });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/employer/jobs", window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(JOBS_PER_PAGE));
      if (search) {
        url.searchParams.set("search", search);
      }
      if (statusFilter !== "All") {
        const filterMap: Record<string, string> = {
          "Active":   "APPROVED",
          "Pending":  "PENDING",
          "Draft":    "DRAFT",
          "Closed":   "CLOSED",
          "Rejected": "REJECTED",
        };
        url.searchParams.set("status", filterMap[statusFilter]);
      }

      const result = await apiFetch<any>(url.toString());

      const items = result.data?.items || (result as any).items || [];
      const mapped = items.map((job: any) => {
        const statusMap: Record<string, JobDisplayStatus> = {
          "APPROVED": "Active",
          "PENDING": "Pending",
          "DRAFT": "Draft",
          "CLOSED": "Closed",
          "REJECTED": "Rejected",
          "EXPIRED": "Expired"
        };
        return {
          id: job.id,
          title: job.jobTitle,
          domain: job.role?.name || "Cybersecurity",
          type: ({ FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship" } as Record<string, string>)[job.jobType] || job.jobType || "Full-time",
          location: job.location?.displayName || "Remote",
          applicants: job._count?.applications || 0,
          views: job.viewCount || 0,
          posted: new Date(job.createdAt).toLocaleDateString(),
          status: statusMap[job.status] || "Draft",
        };
      });

      setJobs(mapped);
      setTotalJobs(result.data?.meta?.total || (result as any).meta?.total || mapped.length);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error(err);
      toast({ type: "error", ...describeError(err, "Failed to load jobs") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isVerified) return;
    apiFetch<{ active: number; pending: number; draft: number; closed: number }>("/api/employer/jobs/counts")
      .then((res) => { if (res.data) setCounts(res.data); })
      .catch(() => null);
  }, [kycStatus]);

  useEffect(() => {
    if (isVerified) fetchJobs();
  }, [page, statusFilter, search, kycStatus]);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job draft?")) return;

    try {
      await apiFetch(`/api/employer/jobs/${jobId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      toast({ type: "success", message: "Job draft deleted successfully" });
      fetchJobs();
      setCounts((prev) => ({ ...prev, draft: Math.max(0, prev.draft - 1) }));
    } catch (err) {
      toast({ type: "error", ...describeError(err, "Could not delete job. Note: Only draft jobs can be deleted.") });
    }
  };

  const totalPages = Math.ceil(totalJobs / JOBS_PER_PAGE);

  function goPage(n: number) { setPage(Math.max(1, Math.min(n, totalPages))); }
  function setStatusAndReset(s: StatusFilterType) { setStatusFilter(s); setPage(1); }
  function setSearchAndReset(s: string) { setSearch(s); setPage(1); }

  return (
    <>
      <EmployerTopbar title="My Jobs" />
      <KycGate>
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{counts.active}</span> active · <span className="font-semibold text-slate-900">{counts.pending}</span> pending · <span className="font-semibold text-slate-900">{counts.draft}</span> draft · <span className="font-semibold text-slate-900">{counts.closed}</span> closed
            </p>
          </div>
          <Link
            href="/employer/jobs/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" /> Post a Job
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-xs shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearchAndReset(e.target.value)}
              placeholder="Search job titles…"
              className="text-sm bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none flex-1"
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusAndReset(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === s
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-120">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 font-mono">JOB TITLE</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden md:table-cell">TYPE</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden lg:table-cell">LOCATION</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 font-mono">APPLICANTS</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">VIEWS</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono">STATUS</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">POSTED</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <JobTableSkeleton count={5} />
                </tbody>
              </table>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="w-8 h-8 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium text-sm">No jobs found</p>
              <Link href="/employer/jobs/new" className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                Post your first job
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 font-mono">JOB TITLE</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden md:table-cell">TYPE</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden lg:table-cell">LOCATION</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 font-mono">APPLICANTS</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">VIEWS</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono">STATUS</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">POSTED</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => {
                  const cfg = STATUS_CFG[job.status] || STATUS_CFG.Draft;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <Link href={`/employer/jobs/${job.id}`} className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors hover:underline">{job.title}</Link>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{job.domain}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell">{job.type}</td>
                      <td className="px-4 py-3.5 text-slate-500 hidden lg:table-cell">{job.location}</td>
                      <td className="px-4 py-3.5 text-center">
                        <Link href="/employer/applicants" className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                          <Users className="w-3.5 h-3.5 text-slate-300" />{job.applicants}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                        <span className="flex items-center justify-center gap-1 text-sm text-slate-500">
                          <Eye className="w-3.5 h-3.5 text-slate-300" />{job.views}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                          {cfg.icon}{job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 font-mono hidden sm:table-cell">{job.posted}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/employer/jobs/${job.id}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="View job"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {(job.status === "Draft" || job.status === "Pending" || job.status === "Active") && (
                            <Link
                              href={`/employer/jobs/${job.id}/edit`}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit job"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {job.status === "Draft" && (
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete job"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-mono text-slate-400">
              Showing <span className="text-slate-700 font-bold">{(page - 1) * JOBS_PER_PAGE + 1}–{Math.min(page * JOBS_PER_PAGE, totalJobs)}</span> of <span className="text-slate-700 font-bold">{totalJobs}</span> jobs
            </p>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm">
              <button
                onClick={() => goPage(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              <div className="w-px h-4 bg-slate-200 mx-1" />

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => goPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    n === page
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  {n}
                </button>
              ))}

              <div className="w-px h-4 bg-slate-200 mx-1" />

              <button
                onClick={() => goPage(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
      </KycGate>
    </>
  );
}
