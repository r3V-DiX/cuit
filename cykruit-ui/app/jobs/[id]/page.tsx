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
  Building2, Users, Globe, Sparkles, X, FileText, ChevronDown,
} from "lucide-react";
import { use } from "react";
import { apiFetch, authHeaders } from "@/lib/api";

function formatEnum(value: string): string {
  if (!value) return value;
  if (value === "SIZE_1000_PLUS") return "1000+";
  return value
    .replace(/SIZE_(\d+)_(\d+)/, "$1–$2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Step enum ─────────────────────────────────────────────────────────────────
type ApplyStep = "idle" | "screening" | "resume" | "submitting";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  // ── Apply modal state ──────────────────────────────────────────────────────
  const [applyStep, setApplyStep] = useState<ApplyStep>("idle");
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [resumesLoading, setResumesLoading] = useState(false);

  useEffect(() => {
    apiFetch<any>("/api/auth/me", { skipAuthRedirect: true })
      .then((r) => { if (r.data) setUser(r.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadJob() {
      try {
        const result = await apiFetch<any>(`/api/public/jobs/${id}`);
        if (result?.data) {
          const d = result.data;
          setJob({
            id: d.id,
            title: d.jobTitle,
            company: d.employer?.companyName || "Unknown Company",
            location: d.location?.displayName || "Remote",
            type: d.jobType,
            remote: d.workMode,
            description: d.description || "",
            logo: d.employer?.companyName?.[0] || "C",
            slug: d.slug,
            accent: "bg-blue-100 text-blue-800",
            posted: new Date(d.publishedAt || Date.now()).toLocaleDateString(),
            tags: d.skills?.map((s: any) => s.skill?.name || s.name) || [],
            domain: d.role?.name || "Cybersecurity",
            responsibilities: Array.isArray(d.responsibilities) ? d.responsibilities : [],
            requirements: [
              ...(Array.isArray(d.requirements) ? d.requirements : []),
              ...(d.certifications?.map((c: any) => c.name) || []),
            ],
            niceToHave: Array.isArray(d.niceToHave) ? d.niceToHave : [],
            companyDescription: d.employer?.about || "",
            companyIndustry: d.employer?.industry || "",
            companySize: d.employer?.companySize || "",
            applicationType: d.applicationType || "DIRECT",
            externalUrl: d.externalUrl || null,
            screeningQuestions: Array.isArray(d.screeningQuestions) ? d.screeningQuestions : [],
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error(err);
      }
      setLoading(false);
    }
    loadJob();
  }, [id]);

  useEffect(() => {
    if (!job || !user) return;
    apiFetch<{ items?: any[] }>("/api/seeker/saved-jobs")
      .then((b) => { const items = b?.data?.items ?? []; setIsSaved(items.some((s: any) => s.job?.id === job.id)); })
      .catch(() => {});
    apiFetch<{ items?: any[] }>("/api/seeker/applications")
      .then((b) => { const items = b?.data?.items ?? []; setIsApplied(items.some((a: any) => a.jobId === job.id)); })
      .catch(() => {});
    if (user.userType !== "EMPLOYER" && job.slug) {
      apiFetch<any>(`/api/seeker/jobs/${job.slug}/match-score`)
        .then((b) => { const score = b?.data?.score ?? (b as any)?.score; if (score !== undefined) setMatchScore(score); })
        .catch(() => {});
    }
  }, [job, user]);

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!job) return;
    if (!user) { toast({ type: "warning", message: "Sign in to save jobs" }); return; }
    try {
      if (isSaved) {
        await apiFetch(`/api/seeker/jobs/${job.id}/save`, { method: "DELETE", headers: authHeaders() });
        setIsSaved(false);
        toast({ type: "info", message: "Removed from saved" });
      } else {
        await apiFetch(`/api/seeker/jobs/${job.id}/save`, { method: "POST", headers: authHeaders(), body: JSON.stringify({}) });
        setIsSaved(true);
        toast({ type: "success", message: "Job saved" });
      }
    } catch {
      toast({ type: "error", message: "Failed to update saved jobs" });
    }
  }

  // ── Apply — step 1: gate checks ───────────────────────────────────────────
  function handleApplyClick() {
    if (!job) return;
    if (!user) { window.location.href = `/login?next=/jobs/${job.id}`; return; }
    if (user.role === "EMPLOYER" || user.userType === "EMPLOYER") {
      toast({ type: "warning", message: "Employers cannot apply for jobs" });
      return;
    }
    if (job.applicationType === "EXTERNAL" && job.externalUrl) {
      window.open(job.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (isApplied) {
      toast({ type: "warning", message: "Already applied to this job" });
      return;
    }
    // Has screening questions → show screening modal first
    if (job.screeningQuestions?.length > 0) {
      setScreeningAnswers({});
      setApplyStep("screening");
    } else {
      // No questions → go straight to resume selection
      openResumeStep();
    }
  }

  // ── Apply — step 2: open resume modal ─────────────────────────────────────
  async function openResumeStep() {
    setApplyStep("resume");
    setResumesLoading(true);
    setSelectedResumeId(null);
    try {
      const res = await apiFetch<any>("/api/profile/resumes", { credentials: "include" });
      const items: any[] = res?.data?.items ?? res?.data ?? [];
      setResumes(Array.isArray(items) ? items : []);
    } catch {
      setResumes([]);
    } finally {
      setResumesLoading(false);
    }
  }

  // ── Apply — from screening modal next ─────────────────────────────────────
  function handleScreeningNext() {
    const unanswered = (job.screeningQuestions ?? []).filter(
      (q: any) => q.required && !screeningAnswers[q.id]?.trim()
    );
    if (unanswered.length > 0) {
      toast({ type: "warning", message: "Answer all required questions before continuing" });
      return;
    }
    openResumeStep();
  }

  // ── Apply — final submit ──────────────────────────────────────────────────
  async function handleSubmitApplication() {
    if (!job) return;
    setApplyStep("submitting");
    const answers = Object.entries(screeningAnswers)
      .filter(([, v]) => v.trim())
      .map(([questionId, answer]) => ({ questionId, answer }));
    try {
      await apiFetch(`/api/seeker/jobs/${job.id}/apply`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...(selectedResumeId ? { resumeId: selectedResumeId } : {}),
          ...(answers.length > 0 ? { screeningAnswers: answers } : {}),
        }),
      });
      setIsApplied(true);
      setApplyStep("idle");
      toast({ type: "success", message: "Application submitted!", description: `Applied to "${job.title}" at ${job.company}.` });
    } catch (err: any) {
      setApplyStep("resume");
      toast({ type: "error", message: "Application failed", description: err.message || "An unexpected error occurred." });
    }
  }

  function closeModal() { setApplyStep("idle"); }

  // ── Render ────────────────────────────────────────────────────────────────
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

  const related: any[] = [];

  return (
    <>
      <Navbar />

      {/* ── Screening Questions Modal ──────────────────────────────────────── */}
      {applyStep === "screening" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Screening Questions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Answer before submitting your application</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {job.screeningQuestions.map((q: any) => (
                <div key={q.id}>
                  <label className="block text-sm text-slate-700 font-medium mb-1.5">
                    {q.question}
                    {q.required && <span className="ml-1 text-rose-500">*</span>}
                  </label>
                  {q.type === "BOOLEAN" ? (
                    <div className="flex gap-3">
                      {["Yes", "No"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setScreeningAnswers((p) => ({ ...p, [q.id]: opt }))}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                            screeningAnswers[q.id] === opt
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : q.type === "MULTIPLE_CHOICE" && q.options?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt: string) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setScreeningAnswers((p) => ({ ...p, [q.id]: opt }))}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                            screeningAnswers[q.id] === opt
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      value={screeningAnswers[q.id] ?? ""}
                      onChange={(e) => setScreeningAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                      placeholder="Your answer…"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all resize-none"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors">
                Cancel
              </button>
              <button
                onClick={handleScreeningNext}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors flex items-center gap-2"
              >
                Next <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resume Selection Modal ─────────────────────────────────────────── */}
      {(applyStep === "resume" || applyStep === "submitting") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Select Resume</h2>
                <p className="text-xs text-slate-500 mt-0.5">Choose which resume to submit with your application</p>
              </div>
              <button onClick={closeModal} disabled={applyStep === "submitting"} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer disabled:opacity-50">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4">
              {resumesLoading ? (
                <p className="text-sm text-slate-400 text-center py-4">Loading resumes…</p>
              ) : resumes.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 mb-1">No resumes uploaded yet</p>
                  <p className="text-xs text-slate-400">You can still apply without a resume, or upload one from your profile.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {resumes.map((r: any) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedResumeId(r.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        selectedResumeId === r.id
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.fileName || r.originalName || "Resume"}</p>
                        {r.createdAt && (
                          <p className="text-xs text-slate-400">Uploaded {new Date(r.createdAt).toLocaleDateString()}</p>
                        )}
                      </div>
                      {selectedResumeId === r.id && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
              {resumes.length > 0 && !selectedResumeId && (
                <p className="text-xs text-slate-400 mt-2 text-center">No resume selected — you can still apply without one</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center gap-2">
              {job.screeningQuestions?.length > 0 ? (
                <button
                  onClick={() => setApplyStep("screening")}
                  disabled={applyStep === "submitting"}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              ) : (
                <button
                  onClick={closeModal}
                  disabled={applyStep === "submitting"}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmitApplication}
                disabled={applyStep === "submitting"}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {applyStep === "submitting" ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Application</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-slate-50 pt-16">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="relative bg-white border-b border-slate-200 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-grid-sm" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/50 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
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
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{job.location}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" />{formatEnum(job.type)}</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" />{formatEnum(job.remote)}</span>
                  <span className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">Posted {job.posted}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.tags.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600 bg-slate-100 rounded-lg">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                {user?.userType !== "EMPLOYER" && (
                  <button
                    onClick={handleApplyClick}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer ${
                      isApplied
                        ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                    }`}
                  >
                    <Send className="w-4 h-4" /> {isApplied ? "Applied" : job.applicationType === "EXTERNAL" ? "Apply Externally" : "Apply Now"}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                    isSaved ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100/50" : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} /> {isSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — main content */}
            <div className="lg:col-span-2 space-y-5">
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" /> About the Role
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">{job.description}</p>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Responsibilities</h2>
                {job.responsibilities?.length > 0 ? (
                  <ul className="space-y-2.5">
                    {job.responsibilities.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400 italic">No specific responsibilities listed.</p>}
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Requirements</h2>
                {job.requirements?.length > 0 ? (
                  <ul className="space-y-2.5">
                    {job.requirements.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400 italic">No specific requirements listed.</p>}
              </section>

              {job.niceToHave?.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 mb-3">Nice to Have</h2>
                  <ul className="space-y-2.5">
                    {job.niceToHave.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-500 font-mono">
                        <span className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Screening questions hint — show only when job has them, don't render inline form */}
              {job.applicationType !== "EXTERNAL" && job.screeningQuestions?.length > 0 && (
                <section className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">This job has {job.screeningQuestions.length} screening question{job.screeningQuestions.length > 1 ? "s" : ""}</p>
                    <p className="text-xs text-blue-600 mt-0.5">You'll be asked to answer them when you click Apply.</p>
                  </div>
                </section>
              )}
            </div>

            {/* Right — sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {user?.userType === "EMPLOYER" ? "Employer Access" : "Ready to apply?"}
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  {user?.userType === "EMPLOYER"
                    ? "Employers cannot apply for jobs."
                    : job.applicationType === "EXTERNAL"
                    ? "This role uses an external application on the company website."
                    : `Submit your application directly to ${job.company}.`}
                </p>
                {user?.userType !== "EMPLOYER" && (
                  <button
                    onClick={handleApplyClick}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer ${
                      isApplied
                        ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                    }`}
                  >
                    <Send className="w-4 h-4" /> {isApplied ? "Applied" : job.applicationType === "EXTERNAL" ? "Apply Externally" : "Apply Now"}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                    isSaved ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100/50" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} /> {isSaved ? "Saved" : "Save Job"}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">About {job.company}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{job.companyDescription}</p>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600"><Building2 className="w-3.5 h-3.5 text-slate-400" />{job.companyIndustry}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-600"><Users className="w-3.5 h-3.5 text-slate-400" />{formatEnum(job.companySize)}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-600"><Globe className="w-3.5 h-3.5 text-slate-400" />{job.remote}</div>
                </div>
              </div>

              {user && user.userType !== "EMPLOYER" && matchScore !== null && matchScore > 0 && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <h3 className="text-sm font-semibold text-violet-900">AI Match Score</h3>
                    <span className="ml-auto text-[10px] font-bold text-white bg-violet-500 px-1.5 py-0.5 rounded-full">AI</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-violet-700 font-mono leading-none">{matchScore}%</span>
                    <span className="text-xs text-violet-500 mb-0.5">match with your profile</span>
                  </div>
                  <div className="h-2 bg-violet-200 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${matchScore}%` }} />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Job Details</h3>
                <div className="space-y-2">
                  {[
                    { label: "Domain",    value: job.domain },
                    { label: "Type",      value: formatEnum(job.type) },
                    { label: "Work Mode", value: formatEnum(job.remote) },
                    { label: "Location",  value: job.location },
                    { label: "Posted",    value: job.posted },
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
                  <Link key={j.id} href={`/jobs/${j.id}`} className="group flex flex-col gap-3 p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${j.accent} flex items-center justify-center shrink-0 font-bold text-xs font-mono`}>{j.logo}</div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-mono truncate">{j.company}</p>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{j.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{j.location}</span><span>{j.posted}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

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
