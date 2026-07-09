"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  MapPin, Clock, X, ArrowRight, ChevronDown,
  Shield, Terminal, Lock, Bug, Wifi, Eye, Cpu, Crosshair,
  Network, Binary, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { domains, jobTypes, remoteTypes, type Job } from "@/lib/jobs-data";
import SearchBox from "@/components/ui/SearchBox";

const JOBS_PER_PAGE = 9;

const cyberIcons = [
  Terminal, Shield, Lock, Bug, Wifi, Eye,
  Terminal, Shield, Crosshair, Network, Binary, Cpu,
];

function formatEnum(value: string): string {
  if (!value) return value;
  if (value === "SIZE_1000_PLUS") return "1000+";
  return value
    .replace(/SIZE_(\d+)_(\d+)/, "$1–$2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Data layer ─────────────────────────────────────────────────────────────
// TODO: replace this with a real fetch when backend is ready:
//   const res = await fetch(`/api/jobs?q=${q}&spec=${spec}&type=${type}&mode=${mode}&page=${page}&limit=${limit}`)
//   return res.json()
async function fetchJobs(params: {
  q: string; spec: string; type: string; mode: string; page: number; limit: number;
}): Promise<{ data: Job[]; total: number; totalPages: number }> {
  try {
    const { q, spec, type, mode, page, limit } = params;
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const url = new URL("/api/public/jobs", base);
    if (q) url.searchParams.set("search", q);
    if (type && type !== "All") {
      url.searchParams.set("jobType", type.toUpperCase().replace(/-/g, "_"));
    }
    if (mode && mode !== "All") {
      url.searchParams.set("workMode", mode.toUpperCase().replace("-", "_"));
    }
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString());
    if (res.ok) {
      const result = await res.json();
      
      let rawJobs = [];
      if (Array.isArray(result.data)) rawJobs = result.data;
      else if (result.data && Array.isArray(result.data.jobs)) rawJobs = result.data.jobs;
      else if (result.data && Array.isArray(result.data.data)) rawJobs = result.data.data;
      else if (Array.isArray(result.jobs)) rawJobs = result.jobs;
      else if (Array.isArray(result)) rawJobs = result;

      const mapped = rawJobs.map((job: any) => ({
        id: job.id,
        title: job.jobTitle,
        company: job.employer?.companyName || "Unknown Company",
        location: job.location?.displayName || "Remote",
        type: job.jobType,
        remote: job.workMode,
        description: job.description || "",
        logo: job.employer?.companyName?.[0] || "C",
        accent: "bg-blue-100 text-blue-800",
        posted: new Date(job.publishedAt || Date.now()).toLocaleDateString(),
        tags: job.skills?.map((s: any) => s.name) || [],
        domain: job.role?.name || "Cybersecurity",
      }));
      return { data: mapped, total: result.total || result.data?.total || mapped.length, totalPages: result.totalPages || result.data?.totalPages || 1 };
    }
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
  }

  return { data: [], total: 0, totalPages: 0 };
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsContent />
    </Suspense>
  );
}

const SMART_EXAMPLES = [
  "senior red teamer with OSCP, remote US",
  "cloud security architect AWS 5+ years",
  "appsec engineer fintech London",
];

function JobsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [smartSearch, setSmartSearch] = useState(false);
  const [smartInput, setSmartInput] = useState("");

  const search     = params.get("q")    ?? "";
  const specFilter = params.get("spec") ?? "All";
  const typeFilter = params.get("type") ?? "All";
  const modeFilter = params.get("mode") ?? "All";
  const page       = Number(params.get("page") ?? "1");

  const [result, setResult] = useState<{ data: Job[]; total: number; totalPages: number }>({
    data: [], total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchJobs({ q: search, spec: specFilter, type: typeFilter, mode: modeFilter, page, limit: JOBS_PER_PAGE })
      .then(setResult)
      .finally(() => setLoading(false));
  }, [search, specFilter, typeFilter, modeFilter, page]);

  const setParams = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === "All" || v === "1") next.delete(k);
      else next.set(k, v);
    });
    if (!("page" in updates)) next.delete("page");
    router.push(`/jobs?${next.toString()}`, { scroll: false });
  }, [params, router]);

  const activeFilters = [specFilter, typeFilter, modeFilter].filter((f) => f !== "All");
  const hasAnyFilter = activeFilters.length > 0 || !!search;

  const clearAll = () => {
    router.push("/jobs", { scroll: false });
  };

  const goPage = (n: number) => {
    setParams({ page: String(n) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { data: paginated, total, totalPages } = result;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-16">

        {/* ── Hero / search + filters ─────────────────────────────────────── */}
        <div className="relative bg-white border-b-2 border-slate-200">
          {/* Grid */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          {/* Top glow line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-500/60 to-transparent" />
          {/* Bottom glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/40 to-transparent" />

          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-blue-300 pointer-events-none" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-blue-300 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-blue-300 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-blue-300 pointer-events-none" />

          {/* Circuit SVG top-right */}
          <svg className="absolute top-0 right-0 w-64 h-48 pointer-events-none opacity-30" viewBox="0 0 256 192" fill="none">
            <path d="M256 40 L196 40 L196 10 L130 10" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
            <path d="M256 100 L210 100 L210 60 L150 60" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
            <path d="M256 160 L230 160 L230 120 L175 120 L175 80" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
            <circle cx="196" cy="40" r="3" fill="#3B82F6"/>
            <circle cx="210" cy="100" r="3" fill="#06B6D4"/>
            <circle cx="230" cy="160" r="3" fill="#3B82F6"/>
            <circle cx="130" cy="10" r="2" fill="#3B82F6" opacity="0.5"/>
            <circle cx="150" cy="60" r="2" fill="#06B6D4" opacity="0.5"/>
          </svg>

          {/* Circuit SVG bottom-left */}
          <svg className="absolute bottom-0 left-0 w-48 h-36 pointer-events-none opacity-20" viewBox="0 0 192 144" fill="none">
            <path d="M0 100 L50 100 L50 130 L100 130" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
            <path d="M0 50 L40 50 L40 80 L90 80" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
            <circle cx="50" cy="100" r="3" fill="#3B82F6"/>
            <circle cx="40" cy="50" r="3" fill="#06B6D4"/>
          </svg>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            <div className="flex items-center gap-1.5 text-xs font-mono text-blue-600 mb-4">
              <Shield className="w-3.5 h-3.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              CYBERSECURITY JOBS
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Browse Open Roles</h1>

            <div className="max-w-2xl bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
              <p className="text-slate-600 text-sm leading-relaxed mb-2">
                Every role on Cykruit is hand-verified and specific to cybersecurity — no generic IT noise, no
                recruiter spam. From red team operators to cloud security architects, find the role that actually
                matches your skillset.
              </p>
            </div>
          </div>
        </div>

        {/* ── Search + filters bar ────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
            {/* Search */}
            <SearchBox
              defaultValue={search}
              placeholder="Search roles, skills, companies…"
              onSearch={(q) => setParams({ q })}
              className="flex-1 min-w-0 max-w-sm"
            />

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

            {/* Filter dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown label="Domain" options={domains} value={specFilter} onChange={(v) => setParams({ spec: v })} />
              <FilterDropdown label="Job Type"       options={jobTypes}        value={typeFilter} onChange={(v) => setParams({ type: v })} />
              <FilterDropdown label="Work Mode"      options={remoteTypes}     value={modeFilter} onChange={(v) => setParams({ mode: v })} />

              {activeFilters.map((f) => (
                <span key={f} className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  {f}
                  <button onClick={() => {
                    if (specFilter === f) setParams({ spec: "All" });
                    else if (typeFilter === f) setParams({ type: "All" });
                    else setParams({ mode: "All" });
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {hasAnyFilter && (
                <button onClick={clearAll} className="text-[11px] font-mono text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Smart Search bar ────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className={`rounded-2xl border transition-all ${smartSearch ? "bg-violet-50 border-violet-200" : "bg-white border-slate-200"} p-4`}>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">Smart Search <span className="ml-1 text-[10px] font-bold text-white bg-violet-500 px-1.5 py-0.5 rounded-full align-middle">AI</span></p>
                <p className="text-xs text-slate-400">Describe what you're looking for in plain English</p>
              </div>
              <button
                type="button"
                onClick={() => setSmartSearch(!smartSearch)}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${smartSearch ? "bg-violet-600" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${smartSearch ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
              </button>
            </div>

            {smartSearch && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <input
                    value={smartInput}
                    onChange={(e) => setSmartInput(e.target.value)}
                    placeholder="e.g. senior red teamer with OSCP, remote US…"
                    className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-violet-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all"
                  />
                  <button
                    disabled={!smartInput.trim()}
                    className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Search
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[11px] font-mono text-slate-400">Try:</span>
                  {SMART_EXAMPLES.map((ex) => (
                    <button key={ex} onClick={() => setSmartInput(ex)}
                      className="text-[11px] font-mono text-violet-600 bg-white border border-violet-200 rounded-lg px-2 py-0.5 hover:bg-violet-50 transition-colors cursor-pointer">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Jobs grid ───────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Result count */}
          <p className="text-sm text-slate-500 mb-5">
            {loading ? (
              <span className="text-slate-400">Loading…</span>
            ) : (
              <><span className="font-semibold text-slate-900">{total}</span> jobs found</>
            )}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: JOBS_PER_PAGE }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                      <div className="h-4 bg-slate-100 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded" />
                  <div className="flex gap-1.5">
                    <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                    <div className="h-6 w-20 bg-slate-100 rounded-lg" />
                    <div className="h-6 w-14 bg-slate-100 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Shield className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">No jobs match your filters</p>
              <button onClick={clearAll} className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginated.map((job, i) => {
                const CyberIcon = cyberIcons[i % cyberIcons.length];
                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="group relative flex flex-col gap-4 p-5 rounded-2xl bg-white border border-slate-200 border-l-2 border-l-slate-200 shadow-sm hover:border-blue-300 hover:border-l-blue-400 hover:shadow-md hover:shadow-blue-500/8 transition-all duration-200 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500/60 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <CyberIcon className="absolute top-4 right-4 w-5 h-5 text-slate-100 group-hover:text-blue-100 transition-colors" />

                    <div className="flex items-center gap-3 pr-6">
                      <div className={`w-10 h-10 rounded-xl ${job.accent} flex items-center justify-center shrink-0 font-bold text-xs font-mono`}>
                        {job.logo}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-medium font-mono truncate">{job.company}</p>
                        <h3 className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors truncate">
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />{job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />{formatEnum(job.type)}
                      </span>
                    </div>

                    {job.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {job.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600 bg-slate-100 rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400 font-mono">{job.posted}</span>
                      <span className="text-[11px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-mono">
                        View role <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm">
                <button
                  onClick={() => goPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {(() => {
                  const pages: (number | "…")[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (page > 3) pages.push("…");
                    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                    if (page < totalPages - 2) pages.push("…");
                    pages.push(totalPages);
                  }
                  return pages.map((n, i) =>
                    n === "…" ? (
                      <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm select-none">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => goPage(n)}
                        className={`w-8 h-8 rounded-xl text-sm font-semibold transition-all ${
                          n === page
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  );
                })()}

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <button
                  onClick={() => goPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs font-mono text-slate-400">
                Page <span className="text-slate-700 font-bold">{page}</span> of <span className="text-slate-700 font-bold">{totalPages}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-700 font-bold">{total}</span> results
              </p>
            </div>
          )}
        </div>

      </main>
      <Footer />
    </>
  );
}

function FilterDropdown({
  label, options, value, onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== "All";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          active
            ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {active ? value : label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-900/8 py-1 min-w-45">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                  value === opt
                    ? "text-blue-700 bg-blue-50 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
