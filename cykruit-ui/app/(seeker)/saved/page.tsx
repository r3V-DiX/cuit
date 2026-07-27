"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import {
  MapPin, Bookmark, ArrowRight, Clock, Search, X,
  Briefcase, SlidersHorizontal, Inbox, ArrowUpDown,
} from "lucide-react";
import { SavedJobSkeletonList } from "@/components/ui/skeletons/SavedJobSkeleton";
import { apiFetch, authHeaders, describeError } from "@/lib/api";

type SavedJob = {
  id: string;
  jobId: string;
  role: string;
  company: string;
  location: string;
  mode: string;
  type: string;
  skills: string[];
  savedAt: string;
  savedTs: number;
};

const MODES = ["All", "Remote", "Hybrid", "On-site"];
const TYPES = ["All", "Full-time", "Contract", "Part-time"];

function formatSavedAt(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "1d ago";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function mapItem(item: any): SavedJob {
  const j = item.job;
  return {
    id: item.id ?? `${item.seekerId}_${item.jobId}`,
    jobId: j.id,
    role: j.jobTitle ?? j.role?.name ?? "Unknown Role",
    company: j.employer?.companyName ?? "Unknown Company",
    location: j.location
      ? [j.location.city, j.location.country].filter(Boolean).join(", ")
      : "Remote",
    mode: j.workMode ?? "Remote",
    type: j.employmentType ?? "Full-time",
    skills: (j.skills ?? []).map((s: any) => s.skill?.name ?? s.name).slice(0, 4),
    savedAt: formatSavedAt(item.savedAt),
    savedTs: new Date(item.savedAt).getTime(),
  };
}

export default function SavedPage() {
  const { toast } = useToast();
  const { openModal } = useModal();

  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [showFilters, setShowFilters] = useState(false);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const body = await apiFetch<{ items: unknown[] }>("/api/seeker/saved-jobs?limit=50");
      setJobs((body?.data?.items ?? []).map(mapItem));
    } catch (err) {
      toast({ type: "error", ...describeError(err, "Failed to load saved jobs") });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const filtered = useMemo(() => {
    let list = jobs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.role.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.skills.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (modeFilter !== "All") list = list.filter((j) => j.mode === modeFilter);
    if (typeFilter !== "All") list = list.filter((j) => j.type === typeFilter);
    return [...list].sort((a, b) =>
      sort === "newest" ? b.savedTs - a.savedTs : a.savedTs - b.savedTs
    );
  }, [jobs, search, modeFilter, typeFilter, sort]);

  const hasActiveFilters = search || modeFilter !== "All" || typeFilter !== "All";

  async function unsave(job: SavedJob) {
    try {
      await apiFetch(`/api/seeker/jobs/${job.jobId}/save`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setJobs((prev) => prev.filter((j) => j.jobId !== job.jobId));
      toast({ type: "info", message: "Job removed", description: `"${job.role}" at ${job.company} was unsaved.` });
    } catch (err) {
      toast({ type: "error", ...describeError(err, "Failed to unsave job") });
    }
  }

  function clearAll() {
    openModal({
      variant: "danger",
      title: "Clear all saved jobs?",
      description: "All saved jobs will be removed. You can re-save them from the jobs page.",
      onConfirm: async () => {
        await Promise.all(jobs.map((j) =>
          apiFetch(`/api/seeker/jobs/${j.jobId}/save`, { method: "DELETE", headers: authHeaders() })
        ));
        setJobs([]);
        toast({ type: "info", message: "Saved jobs cleared" });
      },
    });
  }

  function clearFilters() {
    setSearch("");
    setModeFilter("All");
    setTypeFilter("All");
  }

  return (
    <>
      <SeekerTopbar title="Saved Jobs" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="space-y-4">

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by role, company or skill…"
                  className="w-full h-9 pl-9 pr-9 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-medium transition-colors shrink-0 ${showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {(modeFilter !== "All" || typeFilter !== "All") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sort === "newest" ? "Newest" : "Oldest"}
              </button>
            </div>

            {showFilters && (
              <div className="flex gap-4 pt-1 flex-wrap">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Work mode</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {MODES.map((m) => (
                      <button
                        key={m}
                        onClick={() => setModeFilter(m)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${modeFilter === m ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Job type</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${typeFilter === t ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Count + clear row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-700">
                {filtered.length} <span className="text-slate-400 font-normal">of {jobs.length} saved roles</span>
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
            {jobs.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {loading ? (
            <SavedJobSkeletonList count={4} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Inbox className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {jobs.length === 0 ? "No saved jobs yet" : "No jobs match your filters"}
              </p>
              {jobs.length === 0 ? (
                <Link href="/jobs" className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">
                  Browse jobs →
                </Link>
              ) : (
                <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job) => (
                <div
                  key={job.id}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all p-5"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 transition-colors">
                        {job.company[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{job.role}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 flex-wrap">
                          <span className="font-medium text-slate-600">{job.company}</span>
                          <span>·</span>
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{job.location}</span>
                          <span>·</span>
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          {job.skills.map((tag) => (
                            <span key={tag} className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.preventDefault(); unsave(job); }}
                        title="Remove from saved"
                        className="w-8 h-8 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <div className="flex items-center gap-1 text-[10px] text-slate-300">
                        <Clock className="w-3 h-3" />
                        {job.savedAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                        job.mode === "Remote" ? "text-green-700 bg-green-50 border-green-200" :
                        job.mode === "Hybrid" ? "text-blue-700 bg-blue-50 border-blue-200" :
                        "text-slate-600 bg-slate-100 border-slate-200"
                      }`}>{job.mode}</span>
                    </div>
                    <Link
                      href={`/jobs/${job.jobId}`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View role <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
