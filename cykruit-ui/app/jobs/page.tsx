"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  MapPin, Clock, X, ArrowRight, ChevronDown,
  Shield, Terminal, Lock, Bug, Wifi, Eye, Cpu, Crosshair,
  Network, Binary, ChevronLeft, ChevronRight,
} from "lucide-react";
import { jobTypes, remoteTypes, type Job } from "@/lib/jobs-data";
import SearchBox from "@/components/ui/SearchBox";
import { apiFetch } from "@/lib/api";
import { JobCardSkeletonGrid } from "@/components/ui/skeletons/JobCardSkeleton";

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

async function fetchDomains(): Promise<{ id: string; name: string; slug: string }[]> {
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const result = await apiFetch<any>(`${base}/api/public/domains`);
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result)) return result;
    return [];
  } catch {
    return [];
  }
}

async function fetchJobs(params: {
  q: string; domainId: string; type: string; mode: string; page: number; limit: number;
}): Promise<{ data: Job[]; total: number; totalPages: number }> {
  try {
    const { q, domainId, type, mode, page, limit } = params;
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const url = new URL("/api/public/jobs", base);
    if (q) url.searchParams.set("search", q);
    if (domainId) url.searchParams.set("domainId", domainId);
    if (type && type !== "All") {
      url.searchParams.set("jobType", type.toUpperCase().replace(/-/g, "_"));
    }
    if (mode && mode !== "All") {
      const workModeMap: Record<string, string> = { "Remote": "REMOTE", "Hybrid": "HYBRID", "On-site": "ONSITE" };
      url.searchParams.set("workMode", workModeMap[mode] ?? mode.toUpperCase());
    }
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    const result = await apiFetch<any>(url.toString());
    const r: any = result;

    let rawJobs = [];
    if (Array.isArray(result.data)) rawJobs = result.data;
    else if (result.data && Array.isArray(result.data.jobs)) rawJobs = result.data.jobs;
    else if (result.data && Array.isArray(result.data.data)) rawJobs = result.data.data;
    else if (Array.isArray(r.jobs)) rawJobs = r.jobs;
    else if (Array.isArray(result)) rawJobs = result;

    const mapped = rawJobs.map((job: any) => {
      const rawDesc: string = job.description || "";
      const introEnd = rawDesc.search(/\n\n(responsibilities|requirements):/i);
      const descSnippet = introEnd > 0 ? rawDesc.slice(0, introEnd).trim() : rawDesc.trim();
      return {
      id: job.id,
      title: job.jobTitle,
      company: job.employer?.companyName || "Unknown Company",
      location: job.location?.displayName || "Remote",
      type: job.jobType,
      remote: job.workMode,
      description: descSnippet,
      logo: job.employer?.companyName?.[0] || "C",
      accent: "bg-blue-100 text-blue-800",
      posted: new Date(job.publishedAt || Date.now()).toLocaleDateString(),
      tags: job.skills?.map((s: any) => s.name) || [],
      domain: job.role?.name || "Cybersecurity",
      isFeatured: job.isFeatured ?? false,
      }; });
    return { data: mapped, total: r.total || result.data?.total || mapped.length, totalPages: r.totalPages || result.data?.totalPages || 1 };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error("Failed to fetch jobs:", error);
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

function JobsContent() {
  const router = useRouter();
  const params = useSearchParams();

  const search     = params.get("q")    ?? "";
  const specFilter = params.get("spec") ?? "All";
  const typeFilter = params.get("type") ?? "All";
  const modeFilter = params.get("mode") ?? "All";
  const page       = Number(params.get("page") ?? "1");

  const [result, setResult] = useState<{ data: Job[]; total: number; totalPages: number }>({
    data: [], total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [domainList, setDomainList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchDomains().then(setDomainList);
  }, []);

  const domainOptions = ["All", ...domainList.map((d) => d.name)];
  const domainIdForFilter = domainList.find((d) => d.name === specFilter)?.id ?? "";

  useEffect(() => {
    setLoading(true);
    fetchJobs({ q: search, domainId: domainIdForFilter, type: typeFilter, mode: modeFilter, page, limit: JOBS_PER_PAGE })
      .then(setResult)
      .finally(() => setLoading(false));
  }, [search, domainIdForFilter, typeFilter, modeFilter, page]);

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
          {/* Grid — server-safe CSS class, no inline style */}
          <div className="absolute inset-0 pointer-events-none bg-grid-xs" />
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

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-semibold text-blue-600 mb-5">
              <Shield className="w-3.5 h-3.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              CYBERSECURITY JOBS
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
              Browse Open Roles
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mb-8">
              Hand-verified cybersecurity roles only — no IT noise, no recruiter spam.
            </p>

            {/* ── Inline search + filters ───────────────────────────────── */}
            <div className="flex flex-col gap-3 max-w-3xl">
              <SearchBox
                defaultValue={search}
                placeholder="Search roles, skills, companies…"
                onSearch={(q) => setParams({ q })}
                className="w-full"
              />

              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                <FilterDropdown label="Domain"    options={domainOptions} value={specFilter} onChange={(v) => setParams({ spec: v })} />
                <FilterDropdown label="Job Type"  options={jobTypes}      value={typeFilter} onChange={(v) => setParams({ type: v })} />
                <FilterDropdown label="Work Mode" options={remoteTypes}   value={modeFilter} onChange={(v) => setParams({ mode: v })} />

                {hasAnyFilter && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 h-9 px-3 text-sm text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>
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
            <JobCardSkeletonGrid count={JOBS_PER_PAGE} />
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
                    {job.isFeatured && (
                      <span className="absolute top-3 right-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-600 border border-amber-200">
                        ⭐ Featured
                      </span>
                    )}
                    <CyberIcon className={`absolute top-4 right-4 w-5 h-5 text-slate-100 group-hover:text-blue-100 transition-colors ${job.isFeatured ? "opacity-0" : ""}`} />

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
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm max-w-full overflow-x-auto scrollbar-hide">
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
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const active = value !== "All";
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const updatePos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  };

  const handleToggle = () => {
    if (!open) updatePos();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        dropRef.current && !dropRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", () => setOpen(false), { once: true });
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const dropdown = open && mounted ? createPortal(
    <div
      ref={dropRef}
      className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 overflow-y-auto"
      style={{ top: pos.top, left: pos.left, minWidth: 160, maxHeight: 280, zIndex: 9999 }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => { onChange(opt); setOpen(false); }}
          className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer whitespace-nowrap ${
            value === opt
              ? "text-blue-700 bg-blue-50 font-semibold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-medium border transition-all cursor-pointer shrink-0 ${
          active
            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
            : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
        }`}
      >
        <span className="max-w-[120px] truncate">{active ? value : label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </div>
  );
}
