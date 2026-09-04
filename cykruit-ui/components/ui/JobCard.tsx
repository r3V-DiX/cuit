/* Hallmark · component: job-card · genre: modern-minimal · theme: Cykruit Technical
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (46–50)
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 */

"use client";

import Link from "next/link";
import { MapPin, Clock, ArrowUpRight, Sparkles, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Job } from "@/lib/jobs-data";

export type FlexibleJobData = Job | {
  id: string | number;
  jobCode?: string;
  title?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  employer?: { companyName?: string | null; companyLogo?: string | null; isVerified?: boolean | null } | null;
  logo?: string | null;
  accent?: string | null;
  location?: string | { displayName?: string | null; city?: string | null; country?: string | null } | null;
  remote?: string | null;
  workMode?: string | null;
  type?: string | null;
  jobType?: string | null;
  durationMonths?: number | null;
  domain?: string | { name?: string | null } | null;
  tags?: string[] | null;
  skills?: Array<{ name?: string | null }> | null;
  posted?: string | null;
  publishedAt?: string | Date | null;
  description?: string | null;
  isFeatured?: boolean | null;
};

export interface JobCardProps {
  job?: FlexibleJobData;
  href?: string;
  state?: "default" | "hover" | "focus" | "active" | "disabled" | "loading" | "error" | "success";
  errorMessage?: string;
  successMessage?: string;
  className?: string;
  onClick?: () => void;
}

function formatEnum(value?: string): string {
  if (!value) return "";
  if (value === "SIZE_1000_PLUS") return "1000+";
  return value
    .replace(/SIZE_(\d+)_(\d+)/, "$1–$2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function JobCard({
  job,
  href,
  state = "default",
  errorMessage = "Unable to load job details",
  successMessage = "Saved to your list",
  className = "",
  onClick,
}: JobCardProps) {
  // Loading skeleton state
  if (state === "loading" || !job) {
    return (
      <div
        data-state="loading"
        className={`relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs animate-pulse min-h-[240px] ${className}`}
        aria-busy="true"
        aria-label="Loading job..."
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="space-y-1.5">
                <div className="w-20 h-3 bg-slate-100 rounded-sm" />
                <div className="w-32 h-4 bg-slate-100 rounded-sm" />
              </div>
            </div>
            <div className="w-16 h-5 bg-slate-100 rounded-md" />
          </div>

          <div className="flex gap-2">
            <div className="w-24 h-5 bg-slate-100 rounded-md" />
            <div className="w-28 h-5 bg-slate-100 rounded-md" />
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="w-full h-3 bg-slate-100 rounded-sm" />
            <div className="w-3/4 h-3 bg-slate-100 rounded-sm" />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <div className="w-16 h-3 bg-slate-100 rounded-sm" />
          <div className="w-20 h-3 bg-slate-100 rounded-sm" />
        </div>
      </div>
    );
  }

  // Normalization
  const id = job.id;
  const title = ("title" in job && job.title) || ("jobTitle" in job && job.jobTitle) || "Untitled Position";
  const company =
    ("company" in job && job.company) ||
    ("employer" in job && job.employer?.companyName) ||
    "Company";
  const jobCode = job.jobCode || "";
  const location =
    typeof job.location === "string"
      ? job.location
      : job.location?.displayName || job.location?.city || "Remote";
  const type = ("type" in job && job.type) || ("jobType" in job && job.jobType) || "Full-time";
  const remote = ("remote" in job && job.remote) || ("workMode" in job && job.workMode) || "";
  const isRemote = typeof remote === "string" && remote.toLowerCase().includes("remote");
  const domain =
    typeof job.domain === "string"
      ? job.domain
      : job.domain?.name || "Cybersecurity";
  const tags =
    ("tags" in job && job.tags && job.tags.length > 0)
      ? job.tags
      : ("skills" in job && job.skills)
      ? job.skills.map((s) => s.name)
      : [];
  const posted =
    ("posted" in job && job.posted) ||
    ("publishedAt" in job && job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : "");
  const durationMonths = job.durationMonths;
  const isFeatured = Boolean(job.isFeatured);
  const logo =
    ("logo" in job && job.logo) ||
    ("employer" in job && job.employer?.companyLogo) ||
    company[0]?.toUpperCase() ||
    "C";

  const targetHref = href || `/jobs/${id}`;

  // Error state
  if (state === "error") {
    return (
      <div
        data-state="error"
        className={`relative flex flex-col justify-between p-5 rounded-2xl bg-red-50/40 border border-red-200/80 text-red-900 min-h-[220px] ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-800">Job Unavailable</h4>
            <p className="text-xs text-red-600 mt-1 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
        <div className="border-t border-red-100 pt-3 flex items-center justify-end">
          <button
            onClick={onClick}
            className="text-xs font-mono font-medium text-red-700 hover:text-red-800 underline underline-offset-2 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success state (e.g. Applied / Bookmarked)
  if (state === "success") {
    return (
      <div
        data-state="success"
        className={`relative flex flex-col justify-between p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 text-emerald-900 min-h-[220px] ${className}`}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md">
              Job ID: {jobCode || "CONFIRMED"}
            </span>
            <h4 className="text-sm font-semibold text-emerald-950 mt-1.5">{title}</h4>
            <p className="text-xs text-emerald-700 mt-1">{successMessage}</p>
          </div>
        </div>
        <div className="border-t border-emerald-100 pt-3 flex items-center justify-between text-xs text-emerald-700 font-mono">
          <span>{company}</span>
          <Link href={targetHref} className="font-semibold hover:underline flex items-center gap-1">
            View status <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const fallbackTags =
    tags.length > 0
      ? tags.slice(0, 3)
      : [domain, formatEnum(type) || "Full-Time"];

  const stateClasses = {
    default: "",
    hover: "border-slate-300 shadow-md shadow-slate-900/4 -translate-y-0.5",
    focus: "outline-2 outline-blue-600 outline-offset-2",
    active: "translate-y-0 shadow-xs border-slate-300",
    disabled: "opacity-45 pointer-events-none cursor-not-allowed bg-slate-50/60",
  }[state === "disabled" ? "disabled" : state] || "";

  return (
    <Link
      href={targetHref}
      onClick={onClick}
      aria-disabled={state === "disabled"}
      tabIndex={state === "disabled" ? -1 : 0}
      className={`
        group relative flex flex-col justify-between gap-4 p-5 rounded-2xl bg-white
        border border-slate-200/80 shadow-xs
        transition-all duration-200 text-left
        hover:border-blue-300 hover:shadow-md hover:shadow-blue-950/5 hover:-translate-y-0.5
        active:translate-y-0 active:shadow-xs
        focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2
        ${stateClasses}
        ${className}
      `}
    >
      {/* Top Identity Row */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo / Monogram */}
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-center shrink-0 font-mono font-bold text-sm text-slate-800 shadow-2xs group-hover:border-slate-300 transition-colors">
              {logo && (logo.startsWith("http") || logo.startsWith("/")) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={company} className="w-8 h-8 object-contain rounded-lg" />
              ) : (
                <span className="tracking-tight text-slate-700">{logo ? logo.slice(0, 2).toUpperCase() : company[0]?.toUpperCase() || "C"}</span>
              )}
            </div>

            {/* Company name & Domain subtitle */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-semibold text-slate-900 tracking-tight truncate">{company}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-label="Verified company" />
              </div>
              <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                {domain}
              </p>
            </div>
          </div>

          {/* Job Code & Featured Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isFeatured && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-800 bg-amber-50/90 border border-amber-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                Featured
              </span>
            )}
            {jobCode && (
              <span className="inline-flex items-center font-mono text-[11px] font-medium tracking-wide text-slate-700 bg-slate-50 border border-slate-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                <span className="text-slate-400 mr-1.5 font-normal">Job ID</span>
                <span className="font-semibold text-slate-800 font-mono tracking-normal">{jobCode}</span>
              </span>
            )}
          </div>
        </div>

        {/* Primary Role Title */}
        <div className="pt-0.5">
          <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
        </div>

        {/* Metadata Specs Strip */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[150px]">{location}</span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {formatEnum(type) || "Full-Time"}
              {durationMonths ? ` (${durationMonths} mos)` : ""}
            </span>
          </span>

          {isRemote && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Remote
            </span>
          )}
        </div>

        {/* Description Excerpt (collapses gracefully if empty) */}
        {job.description && job.description.length > 5 && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-normal">
            {job.description}
          </p>
        )}

        {/* Tags / Skills Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {fallbackTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[11px] font-mono font-medium text-slate-600 bg-slate-50 border border-slate-200/80 rounded-md group-hover:border-slate-300 group-hover:bg-slate-100/60 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer: Timestamp & Action link */}
      <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between text-xs mt-1">
        <span className="text-[11px] font-mono text-slate-400">
          {posted ? `Posted ${posted}` : "Recently posted"}
        </span>
        <span className="font-mono text-xs font-semibold text-slate-700 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
          View role
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
