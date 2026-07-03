"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import {
  MapPin, Bookmark, ArrowRight, Clock, Search, X,
  Briefcase, SlidersHorizontal, Inbox, ArrowUpDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkMode = "Remote" | "Hybrid" | "On-site";

type SavedJob = {
  id: string;
  role: string;
  company: string;
  location: string;
  mode: WorkMode;
  type: string;
  domain: string;
  tags: string[];
  saved: string;
  savedTs: number;
  urgent: boolean;
  description: string;
};

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: SavedJob[] = [
  {
    id: "1",
    role: "Senior Penetration Tester",
    company: "CrowdStrike",
    location: "Remote · US",
    mode: "Remote",
    type: "Full-time",
    domain: "Offensive Security",
    tags: ["Red Team", "OSCP", "Burp Suite", "Python"],
    saved: "2d ago",
    savedTs: Date.now() - 2 * 86400000,
    urgent: false,
    description: "Join CrowdStrike's elite red team conducting advanced adversarial simulations against enterprise clients across web, network, and cloud environments.",
  },
  {
    id: "2",
    role: "AppSec Engineer",
    company: "Stripe",
    location: "Hybrid · SF",
    mode: "Hybrid",
    type: "Full-time",
    domain: "Application Security",
    tags: ["AppSec", "SAST", "DAST", "Kotlin"],
    saved: "3d ago",
    savedTs: Date.now() - 3 * 86400000,
    urgent: true,
    description: "Help Stripe build world-class application security tooling. Work alongside engineers to embed security into the SDLC at scale.",
  },
  {
    id: "3",
    role: "Threat Intel Analyst",
    company: "Recorded Future",
    location: "Remote",
    mode: "Remote",
    type: "Contract",
    domain: "Threat Intelligence",
    tags: ["OSINT", "CTI", "Maltego", "MITRE ATT&CK"],
    saved: "5d ago",
    savedTs: Date.now() - 5 * 86400000,
    urgent: false,
    description: "Track threat actors and produce finished intelligence reports for Recorded Future's enterprise clients using the platform and open-source tooling.",
  },
  {
    id: "4",
    role: "DevSecOps Engineer",
    company: "GitLab",
    location: "Remote",
    mode: "Remote",
    type: "Full-time",
    domain: "DevSecOps",
    tags: ["DevSecOps", "Kubernetes", "Terraform", "CI/CD"],
    saved: "1w ago",
    savedTs: Date.now() - 7 * 86400000,
    urgent: false,
    description: "Own security automation across GitLab's CI/CD pipeline. Design and maintain SAST, DAST, container scanning, and secret detection integrations.",
  },
  {
    id: "5",
    role: "Cloud Security Architect",
    company: "Palo Alto Networks",
    location: "Hybrid · NYC",
    mode: "Hybrid",
    type: "Full-time",
    domain: "Cloud Security",
    tags: ["AWS", "Azure", "Prisma Cloud", "IAM"],
    saved: "1w ago",
    savedTs: Date.now() - 8 * 86400000,
    urgent: true,
    description: "Design security architecture for cloud-native workloads across AWS and Azure. Drive adoption of Prisma Cloud across enterprise customer environments.",
  },
];

const MODES: (WorkMode | "All")[] = ["All", "Remote", "Hybrid", "On-site"];
const TYPES = ["All", "Full-time", "Contract", "Part-time"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedPage() {
  const { toast } = useToast();
  const { openModal } = useModal();

  const [jobs, setJobs] = useState<SavedJob[]>(SEED);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<WorkMode | "All">("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [showFilters, setShowFilters] = useState(false);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = jobs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.role.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (modeFilter !== "All") list = list.filter((j) => j.mode === modeFilter);
    if (typeFilter !== "All") list = list.filter((j) => j.type === typeFilter);
    return [...list].sort((a, b) =>
      sort === "newest" ? b.savedTs - a.savedTs : a.savedTs - b.savedTs
    );
  }, [jobs, search, modeFilter, typeFilter, sort]);

  const hasActiveFilters = search || modeFilter !== "All" || typeFilter !== "All";

  // ── Actions ───────────────────────────────────────────────────────────────────
  function unsave(job: SavedJob) {
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    toast({ type: "info", message: "Job removed", description: `"${job.role}" at ${job.company} was unsaved.` });
  }

  function clearAll() {
    openModal({
      variant: "danger",
      title: "Clear all saved jobs?",
      description: "All saved jobs will be removed. You can re-save them from the jobs page.",
      confirmLabel: "Clear all",
      onConfirm: () => {
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

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <SeekerTopbar title="Saved Jobs" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            {/* Search + action row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by role, company or tag…"
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

            {/* Expandable filters */}
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

          {/* Job cards */}
          {filtered.length === 0 ? (
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
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: logo + info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 transition-colors">
                        {job.company[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">{job.role}</p>
                          {job.urgent && (
                            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">URGENT</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 flex-wrap">
                          <span className="font-medium text-slate-600">{job.company}</span>
                          <span>·</span>
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{job.location}</span>
                          <span>·</span>
                          <span>{job.type}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{job.description}</p>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          {job.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: unsave + saved time */}
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
                        {job.saved}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                        job.mode === "Remote" ? "text-green-700 bg-green-50 border-green-200" :
                        job.mode === "Hybrid" ? "text-blue-700 bg-blue-50 border-blue-200" :
                        "text-slate-600 bg-slate-100 border-slate-200"
                      }`}>{job.mode}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{job.domain}</span>
                    </div>
                    <Link
                      href={`/jobs/${job.id}`}
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
