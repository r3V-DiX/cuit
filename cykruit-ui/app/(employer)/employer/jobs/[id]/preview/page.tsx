"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  ArrowLeft, Edit3, MapPin, Clock, Briefcase,
  CheckCircle2, Building2, Users, Globe, Shield,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

function formatEnum(value: string): string {
  if (!value) return value;
  if (value === "SIZE_1000_PLUS") return "1000+";
  return value
    .replace(/SIZE_(\d+)_(\d+)/, "$1–$2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function JobPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/employer/jobs/${id}`)
      .then((res) => {
        const raw = ((res as { data?: unknown }).data ?? res) as Record<string, unknown>;
        if (raw?.id) setJob(raw);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <EmployerTopbar title="Job Preview" />
        <main className="flex-1 flex items-center justify-center">
          <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <EmployerTopbar title="Job Preview" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Job not found.</p>
        </main>
      </>
    );
  }

  type RawSkill = { skill?: { name?: string } };
  const title = job.jobTitle as string;
  const companyName = (job.employer as { companyName?: string } | undefined)?.companyName ?? "Your Company";
  const companyAbout = (job.employer as { about?: string } | undefined)?.about ?? "";
  const companyIndustry = (job.employer as { industry?: string } | undefined)?.industry ?? "";
  const companySize = (job.employer as { companySize?: string } | undefined)?.companySize ?? "";
  const location = (job.location as { displayName?: string } | undefined)?.displayName ?? "Remote";
  const domain = (job.role as { name?: string } | undefined)?.name ?? "Cybersecurity";
  const skills = ((job.skills as RawSkill[] | undefined) ?? []).map((s) => s.skill?.name).filter(Boolean) as string[];
  const responsibilities = Array.isArray(job.responsibilities) ? job.responsibilities as string[] : [];
  const requirements = Array.isArray(job.requirements) ? job.requirements as string[] : [];
  const niceToHave = Array.isArray(job.niceToHave) ? job.niceToHave as string[] : [];
  const description = (job.description as string) ?? "";
  const jobType = job.jobType as string;
  const workMode = job.workMode as string;
  const status = job.status as string;

  const statusColor =
    status === "APPROVED" ? "text-green-700 bg-green-50 border-green-200" :
    status === "PENDING"  ? "text-amber-700 bg-amber-50 border-amber-200" :
    status === "DRAFT"    ? "text-slate-500 bg-slate-50 border-slate-200" :
                            "text-rose-700 bg-rose-50 border-rose-200";
  const statusLabel =
    status === "APPROVED" ? "Active" :
    status === "PENDING"  ? "Pending Review" :
    status === "DRAFT"    ? "Draft" : "Closed";

  return (
    <>
      <EmployerTopbar title="Job Preview" />
      <main className="flex-1 overflow-y-auto">

        {/* Preview banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono ${statusColor}`}>{statusLabel}</span>
            This is a preview of how your job listing appears to candidates.
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/employer/jobs/${id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <Link href={`/employer/jobs/${id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> Edit Job
            </Link>
          </div>
        </div>

        {/* Job header */}
        <div className="relative bg-white border-b border-slate-200 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-40" style={{
            backgroundImage: "linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

          <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 font-bold text-sm font-mono shadow-sm">
                {companyName[0]}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{title}</h1>
                <p className="text-base font-semibold text-slate-600 mt-0.5">{companyName}</p>

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />{location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />{formatEnum(jobType)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" />{formatEnum(workMode)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {skills.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600 bg-slate-100 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">

              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" /> About the Role
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{description || <span className="text-slate-300 italic">No description added yet.</span>}</p>
              </section>

              {responsibilities.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 mb-3">Responsibilities</h2>
                  <ul className="space-y-2.5">
                    {responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {requirements.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 mb-3">Requirements</h2>
                  <ul className="space-y-2.5">
                    {requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {niceToHave.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 mb-3">Nice to Have</h2>
                  <ul className="space-y-2.5">
                    {niceToHave.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-500 font-mono">
                        <span className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">

              {/* Apply card (read-only preview) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900 mb-1">Ready to apply?</p>
                <p className="text-xs text-slate-500 mb-4">Candidates see an Apply Now button here once the job is active.</p>
                <button disabled className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold border border-slate-200 cursor-not-allowed">
                  Apply Now (preview)
                </button>
              </div>

              {/* Company info */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">About {companyName}</h3>
                {companyAbout && <p className="text-xs text-slate-500 leading-relaxed">{companyAbout}</p>}
                <div className="space-y-2 pt-1">
                  {companyIndustry && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />{companyIndustry}
                    </div>
                  )}
                  {companySize && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />{formatEnum(companySize)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />{formatEnum(workMode)}
                  </div>
                </div>
              </div>

              {/* Job details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Job Details</h3>
                <div className="space-y-2">
                  {[
                    { label: "Domain",    value: domain              },
                    { label: "Type",      value: formatEnum(jobType) },
                    { label: "Work Mode", value: formatEnum(workMode)},
                    { label: "Location",  value: location            },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-2 text-xs">
                      <span className="text-slate-400 font-medium shrink-0">{label}</span>
                      <span className="text-slate-700 font-semibold text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

      </main>
    </>
  );
}
