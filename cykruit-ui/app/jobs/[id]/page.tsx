"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import {
  MapPin, Clock, Briefcase, ArrowLeft, ArrowRight,
  CheckCircle2, Shield, ChevronRight, Bookmark, Send,
  Building2, Users, Globe, Sparkles,
} from "lucide-react";
import { use } from "react";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) setUser(result.data);
        }
      } catch (err) {}
    };
    fetchUser();
  }, []);

  useEffect(() => {
    async function loadJob() {
      try {
        const response = await fetch(`/api/public/jobs/${id}`);
        if (response.ok) {
          const result = await response.json();
          if (result && result.data) {
            const jobData = result.data;
            setJob({
              id: jobData.id,
              title: jobData.jobTitle,
              company: jobData.employer?.companyName || "Unknown Company",
              location: jobData.location?.displayName || "Remote",
              type: jobData.jobType,
              remote: jobData.workMode,
              description: jobData.description || "",
              logo: jobData.employer?.companyName?.[0] || "C",
              accent: "bg-blue-100 text-blue-800",
              posted: new Date(jobData.publishedAt || Date.now()).toLocaleDateString(),
              tags: jobData.skills?.map((s: any) => s.name) || [],
              domain: jobData.role?.name || "Cybersecurity",
              responsibilities: [],
              requirements: jobData.certifications?.map((c: any) => c.name) || [],
              niceToHave: [],
              companyDescription: jobData.employer?.about || "",
              companyIndustry: jobData.employer?.industry || "",
              companySize: jobData.employer?.companySize || "",
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load job", err);
      }
      setLoading(false);
    }
    loadJob();
  }, [id]);

  useEffect(() => {
    if (!job || !user) return;
    fetch(`/api/seeker/saved-jobs`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((body) => {
        const items = body?.data?.items ?? [];
        setIsSaved(items.some((s: any) => s.job?.id === job.id));
      })
      .catch(() => {});
    fetch(`/api/seeker/applications`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((body) => {
        const items = body?.data?.items ?? [];
        setIsApplied(items.some((a: any) => a.jobId === job.id));
      })
      .catch(() => {});
  }, [job, user]);

  async function handleSave() {
    if (!job) return;
    if (!user) {
      toast({ type: "warning", message: "Sign in to save jobs" });
      return;
    }
    try {
      if (isSaved) {
        const res = await fetch(`/api/seeker/jobs/${job.id}/save`, { method: "DELETE", credentials: "include" });
        if (!res.ok) throw new Error();
        setIsSaved(false);
        toast({ type: "info", message: "Job removed", description: `"${job.title}" removed from Saved.` });
      } else {
        const res = await fetch(`/api/seeker/jobs/${job.id}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error();
        setIsSaved(true);
        toast({ type: "success", message: "Job saved", description: `"${job.title}" added to Saved.` });
      }
    } catch {
      toast({ type: "error", message: "Failed to update saved jobs" });
    }
  }

  async function handleApply() {
    if (!job) return;
    if (isApplied) {
      toast({ type: "warning", message: "Already applied", description: "You have already applied for this role." });
      return;
    }

    try {
      const res = await fetch(`/api/seeker/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          coverLetter: "Excited about this opportunity. Let's talk!",
          useAiScoring: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to apply");
      }

      setIsApplied(true);
      toast({ type: "success", message: "Application submitted", description: `Applied to "${job.title}" at ${job.company}!` });
    } catch (err: any) {
      toast({ type: "error", message: "Application failed", description: err.message || "An unexpected error occurred." });
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading job details...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!job) notFound();

  // No mock data available to show related jobs, we could fetch from API but for now keeping it empty.
  const related: any[] = [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-16">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="relative bg-white border-b border-slate-200 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-40" style={{
            backgroundImage: "linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-5">
              <Link href="/jobs" className="hover:text-blue-600 transition-colors">Jobs</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-500">{job.domain}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-700 font-semibold truncate">{job.title}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className={`w-14 h-14 rounded-2xl ${job.accent} flex items-center justify-center shrink-0 font-bold text-sm font-mono shadow-sm`}>
                {job.logo}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{job.title}</h1>
                <p className="text-base font-semibold text-slate-600 mt-0.5">{job.company}</p>

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />{job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />{job.type}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" />{job.remote}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                    Posted {job.posted}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.tags.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600 bg-slate-100 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex sm:flex-col gap-2 shrink-0">
                {user?.userType !== "EMPLOYER" && (
                  <button
                    onClick={handleApply}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer ${
                      isApplied
                        ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                    }`}
                  >
                    <Send className="w-4 h-4" /> {isApplied ? "Applied" : "Apply Now"}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                    isSaved
                      ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100/50"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} /> {isSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — main content */}
            <div className="lg:col-span-2 space-y-5">

              {/* About the role */}
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" /> About the Role
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">{job.description}</p>
              </section>

              {/* Responsibilities */}
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Responsibilities</h2>
                <ul className="space-y-2.5">
                  {job.responsibilities.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Requirements */}
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Requirements</h2>
                <ul className="space-y-2.5">
                  {job.requirements.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Nice to have */}
              {job.niceToHave?.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 mb-3">Nice to Have</h2>
                  <ul className="space-y-2.5">
                    {job.niceToHave.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-500 font-mono">
                        <span className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            </div>

            {/* Right — sidebar */}
            <div className="lg:col-span-1 space-y-4">

              {/* Apply card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {user?.userType === "EMPLOYER" ? "Employer Access" : "Ready to apply?"}
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  {user?.userType === "EMPLOYER" 
                    ? "Employers cannot apply for jobs." 
                    : `Submit your application directly to ${job.company}.`}
                </p>
                {user?.userType !== "EMPLOYER" && (
                  <button
                    onClick={handleApply}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer ${
                      isApplied
                        ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                    }`}
                  >
                    <Send className="w-4 h-4" /> {isApplied ? "Applied" : "Apply Now"}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                    isSaved
                      ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100/50"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} /> {isSaved ? "Saved" : "Save Job"}
                </button>
              </div>

              {/* Company info */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">About {job.company}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{job.companyDescription}</p>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {job.companyIndustry}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {job.companySize}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {job.remote}
                  </div>
                </div>
              </div>

              {/* AI Match Score — only shown to logged-in seekers */}
              {user && user.userType !== "EMPLOYER" && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <h3 className="text-sm font-semibold text-violet-900">AI Match Score</h3>
                    <span className="ml-auto text-[10px] font-bold text-white bg-violet-500 px-1.5 py-0.5 rounded-full">AI</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-violet-700 font-mono leading-none">84%</span>
                    <span className="text-xs text-violet-500 mb-0.5">match with your profile</span>
                  </div>
                  <div className="h-2 bg-violet-200 rounded-full overflow-hidden mb-3">
                    <div className="h-full w-[84%] bg-violet-500 rounded-full" />
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Skills match",     pct: 90 },
                      { label: "Experience level", pct: 80 },
                      { label: "Certifications",   pct: 75 },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-2 text-[11px] text-violet-700">
                        <span className="w-24 shrink-0">{s.label}</span>
                        <div className="flex-1 h-1 bg-violet-200 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="font-bold font-mono w-8 text-right">{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Job details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Job Details</h3>
                <div className="space-y-2">
                  {[
                    { label: "Domain",         value: job.domain         },
                    { label: "Type",           value: job.type           },
                    { label: "Work Mode",      value: job.remote         },
                    { label: "Location",       value: job.location       },
                    { label: "Posted",         value: job.posted         },
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

          {/* ── Related jobs ──────────────────────────────────────────────── */}
          {related.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Similar Roles</h2>
                <Link href="/jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Browse all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="group flex flex-col gap-3 p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm hover:shadow-blue-500/8 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${j.accent} flex items-center justify-center shrink-0 font-bold text-xs font-mono`}>
                        {j.logo}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-mono truncate">{j.company}</p>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{j.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{j.location}</span>
                      <span>{j.posted}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-8">
            <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to all jobs
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
