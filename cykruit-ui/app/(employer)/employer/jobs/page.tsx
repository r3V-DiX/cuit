"use client";

import { useState } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  PlusCircle, Eye, Users, Edit3, Trash2, Search,
  ChevronDown, Briefcase, CheckCircle2, Clock, XCircle,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const JOBS_PER_PAGE = 10;

type JobStatus = "Active" | "Draft" | "Closed";

const STATUS_CFG: Record<JobStatus, { color: string; icon: React.ReactNode }> = {
  Active: { color: "text-green-700 bg-green-50 border-green-200",  icon: <CheckCircle2 className="w-3 h-3" /> },
  Draft:  { color: "text-slate-500 bg-slate-50 border-slate-200",  icon: <Clock        className="w-3 h-3" /> },
  Closed: { color: "text-rose-700 bg-rose-50 border-rose-200",     icon: <XCircle      className="w-3 h-3" /> },
};

const JOBS: {
  id: number; title: string; domain: string; type: string;
  location: string; applicants: number; views: number;
  posted: string; status: JobStatus;
}[] = [
  { id: 1, title: "Senior Penetration Tester", domain: "Offensive Security",    type: "Full-time", location: "Remote",    applicants: 12, views: 340, posted: "3d ago",  status: "Active" },
  { id: 2, title: "Cloud Security Engineer",   domain: "Cloud Security",        type: "Full-time", location: "New York",  applicants:  8, views: 210, posted: "5d ago",  status: "Active" },
  { id: 3, title: "Red Team Operator",         domain: "Offensive Security",    type: "Contract",  location: "Remote",    applicants:  5, views: 180, posted: "1w ago",  status: "Active" },
  { id: 4, title: "AppSec Engineer",           domain: "Application Security",  type: "Full-time", location: "Bangalore", applicants:  0, views:   0, posted: "Today",   status: "Draft"  },
  { id: 5, title: "SOC Analyst Tier 2",        domain: "Blue Team / SOC",       type: "Full-time", location: "London",    applicants: 18, views: 520, posted: "2w ago",  status: "Closed" },
];

const STATUS_FILTERS: (JobStatus | "All")[] = ["All", "Active", "Draft", "Closed"];

export default function MyJobsPage() {
  const [statusFilter, setStatusFilter] = useState<JobStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = JOBS.filter((j) => {
    const matchStatus = statusFilter === "All" || j.status === statusFilter;
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / JOBS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE);

  function goPage(n: number) { setPage(Math.max(1, Math.min(n, totalPages))); }

  // Reset to page 1 when filters change
  function setStatusAndReset(s: JobStatus | "All") { setStatusFilter(s); setPage(1); }
  function setSearchAndReset(s: string)            { setSearch(s);       setPage(1); }

  return (
    <>
      <EmployerTopbar title="My Jobs" />
      <main className="flex-1 overflow-y-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{JOBS.filter(j => j.status === "Active").length}</span> active · <span className="font-semibold text-slate-900">{JOBS.filter(j => j.status === "Draft").length}</span> draft · <span className="font-semibold text-slate-900">{JOBS.filter(j => j.status === "Closed").length}</span> closed
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
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="w-8 h-8 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium text-sm">No jobs found</p>
              <Link href="/employer/jobs/new" className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                Post your first job
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
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
                {paginated.map((job) => {
                  const cfg = STATUS_CFG[job.status];
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
                          <Link
                            href={`/employer/jobs/${job.id}/edit`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit job"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" title="Delete job">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-mono text-slate-400">
              Showing <span className="text-slate-700 font-bold">{(page - 1) * JOBS_PER_PAGE + 1}–{Math.min(page * JOBS_PER_PAGE, filtered.length)}</span> of <span className="text-slate-700 font-bold">{filtered.length}</span> jobs
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
    </>
  );
}
