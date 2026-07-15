"use client";

import { useState, useEffect, useRef } from "react";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import { inferDomain } from "@/lib/jobs-data";
import { Save, Send, ChevronDown, Plus, X, ArrowLeft, CheckCircle2, Circle, Sparkles, GripVertical, ToggleLeft, AlignLeft, ListChecks, Trash2, Wand2, Info, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders } from "@/lib/api";
import { useSubscriptionLimits } from "@/lib/use-subscription-limits";
import { KycGate } from "@/components/employer/KycGate";
import { useKycStatus } from "@/lib/employer-context";
import { LocationSelect, LocationValue } from "@/components/ui/LocationSelect";



const JOB_TYPES   = ["Full-time", "Part-time", "Contract", "Internship"];
const REMOTE_TYPES = ["Remote", "On-site", "Hybrid"];
const LEVELS      = ["Junior (0–2 yrs)", "Mid-level (2–5 yrs)", "Senior (5+ yrs)"];
const DESC_MIN    = 50;

function SelectField({
  label, value, onChange, options, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 pr-8 cursor-pointer"
        >
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function TextField({
  label, value, onChange, placeholder, required, multiline, rows,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; multiline?: boolean; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows ?? 4}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
        />
      )}
    </div>
  );
}

function TagInput({
  label, tags, onChange, placeholder,
}: {
  label: string; tags: string[]; onChange: (t: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-xl min-h-11 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-mono font-medium rounded-lg border border-blue-200">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-blue-900 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }}}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-30 text-sm bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none px-1 py-0.5"
        />
      </div>
      <p className="text-[10px] font-mono text-slate-400">Press Enter or comma to add</p>
    </div>
  );
}

function ListInput({
  label, items, onChange, placeholder,
}: {
  label: string; items: string[]; onChange: (i: string[]) => void; placeholder?: string;
}) {
  function update(idx: number, val: string) {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  }
  function remove(idx: number) { onChange(items.filter((_, i) => i !== idx)); }
  function add() { onChange([...items, ""]); }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => update(idx, e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
            />
            <button onClick={() => remove(idx)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      </div>
    </div>
  );
}

interface UsageLimits {
  jobsUsed: number;
  jobsLimit: number;
}

export default function PostJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [publishing, setPublishing]     = useState(false);
  const [savingDraft, setSavingDraft]   = useState(false);
  const { limits: subLimits, usage: subUsage } = useSubscriptionLimits();
  const usageLimits: UsageLimits | null = subLimits && subUsage
    ? { jobsUsed: subUsage.currentActiveJobs, jobsLimit: subLimits.maxActiveJobs }
    : null;
  const [location, setLocation] = useState<LocationValue>({ city: "", state: "", country: "" });
  const descTooltipTimerRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showDescTip, setShowDescTip]   = useState(false);
  const kycStatus = useKycStatus();
  const [title, setTitle]               = useState("");
  const [domain, setDomain]             = useState("");
  const [type, setType]                 = useState("");
  const [level, setLevel]               = useState("");
  const [isInferring, setIsInferring]   = useState(false);
  const [isDrafting, setIsDrafting]     = useState(false);
  const [remote, setRemote]             = useState("");
  const [description, setDescription]   = useState("");
  const [responsibilities, setResp]     = useState<string[]>([""]);
  const [requirements, setReqs]         = useState<string[]>([""]);
  const [niceToHave, setNice]           = useState<string[]>([]);
  const [tags, setTags]                 = useState<string[]>([]);

  type QuestionType = "text" | "single" | "boolean";
  const questionTypeMap: Record<QuestionType, string> = {
    text: "TEXT",
    single: "MULTIPLE_CHOICE",
    boolean: "BOOLEAN",
  };
  type Question = {
    id: number; type: QuestionType; question: string;
    options: string[]; required: boolean;
  };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sqGenerating, setSqGenerating] = useState(false);
  const [tagsGenerating, setTagsGenerating] = useState(false);

  function addQuestion(type: QuestionType) {
    const defaults: Record<QuestionType, Partial<Question>> = {
      text:    { options: [] },
      single:  { options: ["Option 1", "Option 2"] },
      boolean: { options: ["Yes", "No"] },
    };
    setQuestions((prev) => [...prev, { id: Date.now(), type, question: "", required: false, ...defaults[type] } as Question]);
  }
  function updateQuestion(id: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, ...patch } : q));
  }
  function removeQuestion(id: number) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }
  function updateOption(qid: number, idx: number, val: string) {
    setQuestions((prev) => prev.map((q) => q.id === qid ? { ...q, options: q.options.map((o, i) => i === idx ? val : o) } : q));
  }
  function addOption(qid: number) {
    setQuestions((prev) => prev.map((q) => q.id === qid ? { ...q, options: [...q.options, ""] } : q));
  }
  function removeOption(qid: number, idx: number) {
    setQuestions((prev) => prev.map((q) => q.id === qid ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q));
  }

  function generateAITags() {
    toast({ type: "error", message: "AI tag suggestions coming soon" });
  }

  function generateAIQuestions() {
    toast({ type: "error", message: "AI question generation coming soon" });
  }

  const TYPE_CFG: Record<QuestionType, { label: string; icon: React.ReactNode; color: string }> = {
    text:    { label: "Text",          icon: <AlignLeft   className="w-3.5 h-3.5" />, color: "text-blue-700 bg-blue-50 border-blue-200"   },
    single:  { label: "Single Choice", icon: <ListChecks  className="w-3.5 h-3.5" />, color: "text-violet-700 bg-violet-50 border-violet-200" },
    boolean: { label: "True / False",  icon: <ToggleLeft  className="w-3.5 h-3.5" />, color: "text-green-700 bg-green-50 border-green-200"  },
  };

  async function handlePublish() {
    if (usageLimits && usageLimits.jobsLimit > 0 && usageLimits.jobsUsed >= usageLimits.jobsLimit) {
      toast({
        type: "error",
        message: `Job limit reached (${usageLimits.jobsUsed}/${usageLimits.jobsLimit})`,
        description: "Upgrade your plan to post more jobs.",
      });
      return;
    }
    if (!title.trim()) {
      toast({ type: "error", message: "Job title is required" });
      return;
    }
    if (!type) {
      toast({ type: "error", message: "Job type is required" });
      return;
    }
    if (!level) {
      toast({ type: "error", message: "Experience level is required" });
      return;
    }
    if (!remote) {
      toast({ type: "error", message: "Work mode is required" });
      return;
    }
    if (description.trim().length < DESC_MIN) {
      setShowDescTip(true);
      if (descTooltipTimerRef.current) clearTimeout(descTooltipTimerRef.current);
      descTooltipTimerRef.current = setTimeout(() => setShowDescTip(false), 3000);
      document.getElementById("section-description")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setPublishing(true);
    try {
      const typeMap: Record<string, string> = {
        "Full-time": "FULL_TIME",
        "Part-time": "PART_TIME",
        "Contract": "CONTRACT",
        "Internship": "INTERNSHIP",
      };

      const modeMap: Record<string, string> = {
        "Remote": "REMOTE",
        "On-site": "ONSITE",
        "Hybrid": "HYBRID",
      };

      const levelMap: Record<string, string> = {
        "Junior (0–2 yrs)":    "ENTRY",
        "Mid-level (2–5 yrs)": "MID",
        "Senior (5+ yrs)":     "SENIOR",
      };

      const finalDesc = description.trim();
      const resps = responsibilities.filter(r => r.trim());
      const reqs = requirements.filter(r => r.trim());
      const nice = niceToHave.filter(r => r.trim());

      const result = await apiFetch("/api/employer/jobs", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          jobTitle: title.trim(),
          jobType: typeMap[type],
          workMode: modeMap[remote],
          experienceLevel: levelMap[level],
          description: finalDesc || undefined,
          requirements: reqs.length > 0 ? reqs : undefined,
          responsibilities: resps.length > 0 ? resps : undefined,
          niceToHave: nice.length > 0 ? nice : undefined,
          applicationType: questions.length > 0 ? "SCREENING" : "DIRECT",
          skillNames: tags.length > 0 ? tags : undefined,
          ...(location.country && location.city ? { location } : {}),
          screeningQuestions: questions.length > 0 ? questions.map(q => ({
            id: crypto.randomUUID(),
            type: questionTypeMap[q.type],
            question: q.question,
            required: q.required,
          })) : undefined,
        }),
      });
      const resData = result as any;
      const jobId = resData.data?.id;
      if (!jobId) {
        throw new Error("Job ID not returned from server");
      }

      await apiFetch(`/api/employer/jobs/${jobId}/submit`, {
        method: "POST",
        headers: authHeaders(),
      });

      toast({ type: "success", message: "Job published successfully!" });
      router.push("/employer/jobs");
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Something went wrong") });
    } finally {
      setPublishing(false);
    }
  }

  async function handleSaveDraft() {
    if (!title.trim()) {
      toast({ type: "error", message: "Job title is required" });
      return;
    }
    if (!type || !level || !remote) {
      toast({ type: "error", message: "Please fill in Job Type, Experience Level and Work Mode to save a draft" });
      return;
    }

    setSavingDraft(true);
    try {
      const typeMap: Record<string, string> = {
        "Full-time": "FULL_TIME",
        "Part-time": "PART_TIME",
        "Contract": "CONTRACT",
        "Internship": "INTERNSHIP",
      };

      const modeMap: Record<string, string> = {
        "Remote": "REMOTE",
        "On-site": "ONSITE",
        "Hybrid": "HYBRID",
      };

      const levelMap: Record<string, string> = {
        "Junior (0–2 yrs)":    "ENTRY",
        "Mid-level (2–5 yrs)": "MID",
        "Senior (5+ yrs)":     "SENIOR",
      };

      const finalDesc = description.trim();
      const resps = responsibilities.filter(r => r.trim());
      const reqs = requirements.filter(r => r.trim());
      const nice = niceToHave.filter(r => r.trim());

      await apiFetch("/api/employer/jobs", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          jobTitle: title.trim(),
          jobType: typeMap[type],
          workMode: modeMap[remote],
          experienceLevel: levelMap[level],
          description: finalDesc || undefined,
          requirements: reqs.length > 0 ? reqs : undefined,
          responsibilities: resps.length > 0 ? resps : undefined,
          niceToHave: nice.length > 0 ? nice : undefined,
          applicationType: questions.length > 0 ? "SCREENING" : "DIRECT",
          skillNames: tags.length > 0 ? tags : undefined,
          ...(location.country && location.city ? { location } : {}),
          screeningQuestions: questions.length > 0 ? questions.map(q => ({
            id: crypto.randomUUID(),
            type: questionTypeMap[q.type],
            question: q.question,
            required: q.required,
          })) : undefined,
        }),
      });

      toast({ type: "success", message: "Draft saved successfully!" });
      router.push("/employer/jobs");
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Something went wrong") });
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <>
      <EmployerTopbar title="Post a Job" />
      <KycGate>
      <main className="flex-1 overflow-y-auto p-6">

        {/* Back */}
        <Link href="/employer/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to My Jobs
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

          {/* ── Left: form ──────────────────────────────────────────────────── */}
          <div className="xl:col-span-2 flex flex-col gap-5">

            <section id="section-basics" className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Basic Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <TextField label="Job Title" value={title} onChange={setTitle} placeholder="e.g. Senior Penetration Tester" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Domain</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="e.g. Offensive Security"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setIsInferring(true);
                        try {
                          const res = await fetch("/api/ai/jobs/infer-domain", {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ title }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            if (data.domain) setDomain(data.domain);
                          } else {
                            // Fallback to local logic
                            const inferred = inferDomain(title);
                            if (inferred) setDomain(inferred);
                          }
                        } catch (e) {
                          const inferred = inferDomain(title);
                          if (inferred) setDomain(inferred);
                        } finally {
                          setIsInferring(false);
                        }
                      }}
                      disabled={!title.trim() || isInferring}
                      title="Auto-infer domain from job title"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    >
                      {isInferring ? <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} AI Fill
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">Type a title first, then click AI Fill to auto-detect</p>
                </div>
                <SelectField label="Experience Level" value={level} onChange={setLevel} options={LEVELS} required />
                <SelectField label="Job Type" value={type} onChange={setType} options={JOB_TYPES} required />
                <SelectField label="Work Mode" value={remote} onChange={setRemote} options={REMOTE_TYPES} required />
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <LocationSelect
                    value={location}
                    onChange={setLocation}
                    required={remote !== "Remote"}
                  />
                  {remote === "Remote" && (
                    <p className="text-[10px] font-mono text-slate-400">Location is optional for remote jobs</p>
                  )}
                </div>
              </div>
            </section>

            <section id="section-description" className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-slate-900">Job Description</h2>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono ${description.trim().length < DESC_MIN ? "text-rose-500" : "text-slate-400"}`}>
                    {description.trim().length}/{DESC_MIN} min
                  </span>
                <button
                  type="button"
                  onClick={async () => {
                    setIsDrafting(true);
                    try {
                      const prompt = `Job Title: ${title}\nDomain: ${domain}\nExperience Level: ${level}\nJob Type: ${type}\nWork Mode: ${remote}`;
                      const res = await fetch("/api/ai/job-description/generate", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.description) setDescription(data.description);
                        if (data.requirements && data.requirements.length > 0) setReqs(data.requirements);
                        if (data.responsibilities && data.responsibilities.length > 0) setResp(data.responsibilities);
                        if (data.skills && data.skills.length > 0) {
                          const skillIds = data.skills.map((s: string) => s.toLowerCase());
                          setTags(Array.from(new Set([...tags, ...skillIds])));
                        }
                      }
                    } catch (e) {
                      console.error("AI Draft failed", e);
                    } finally {
                      setIsDrafting(false);
                    }
                  }}
                  disabled={!title.trim() || isDrafting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDrafting ? <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI Draft
                </button>
                </div>
              </div>
              {showDescTip && (
                <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Description must be at least {DESC_MIN} characters before you can publish.
                </div>
              )}
              <TextField
                label="Overview"
                value={description}
                onChange={setDescription}
                placeholder="Describe the role, team, and what makes this opportunity exciting…"
                required multiline rows={6}
              />
            </section>

            <section id="section-responsibilities" className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Responsibilities</h2>
              <ListInput
                label="What will this person do?"
                items={responsibilities}
                onChange={setResp}
                placeholder="e.g. Conduct penetration tests on web and mobile applications"
              />
            </section>

            <section id="section-requirements" className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Requirements</h2>
              <div className="flex flex-col gap-4">
                <ListInput
                  label="Must-have requirements"
                  items={requirements}
                  onChange={setReqs}
                  placeholder="e.g. 3+ years of penetration testing experience"
                />
                <ListInput
                  label="Nice to have (optional)"
                  items={niceToHave}
                  onChange={setNice}
                  placeholder="e.g. OSCP or CEH certification"
                />
              </div>
            </section>

            <section id="section-skills" className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Skills & Tags</h2>
                <button
                  type="button"
                  onClick={generateAITags}
                  disabled={tagsGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {tagsGenerating ? (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {tagsGenerating ? "Generating…" : "AI Suggest"}
                </button>
              </div>
              <TagInput
                label="Add relevant skills/tools"
                tags={tags}
                onChange={setTags}
                placeholder="e.g. Burp Suite, OSCP, Python, AWS…"
              />
            </section>

            {/* ── Screening Questions ─────────────────────────────────────── */}
            <section id="section-screening" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Screening Questions</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Candidates answer these before submitting their application</p>
                </div>
                <button
                  type="button"
                  disabled={sqGenerating || !title.trim()}
                  onClick={generateAIQuestions}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {sqGenerating
                    ? <><span className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" /> Generating…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> AI Generate</>
                  }
                </button>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4">

                {/* Question list */}
                {questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 text-center">
                    <ListChecks className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-500">No screening questions yet</p>
                    <p className="text-xs text-slate-400 mt-1">Use AI to generate questions or add them manually below</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {questions.map((q, idx) => {
                      const tc = TYPE_CFG[q.type];
                      return (
                        <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden">
                          {/* Question header */}
                          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
                            <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                            <span className="text-xs font-mono font-bold text-slate-400 shrink-0">Q{idx + 1}</span>
                            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${tc.color}`}>
                              {tc.icon}{tc.label}
                            </span>
                            <div className="flex-1" />
                            {/* Required toggle */}
                            <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                                className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                              />
                              Required
                            </label>
                            <button onClick={() => removeQuestion(q.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Question body */}
                          <div className="px-4 py-3 flex flex-col gap-3">
                            <input
                              value={q.question}
                              onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                              placeholder="Type your question here…"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                            />

                            {/* Text type hint */}
                            {q.type === "text" && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                                <AlignLeft className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <p className="text-xs text-blue-600">Candidate will type a free-text answer</p>
                              </div>
                            )}

                            {/* Boolean type */}
                            {q.type === "boolean" && (
                              <div className="flex items-center gap-2">
                                {["Yes", "No"].map((opt) => (
                                  <div key={opt} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600">
                                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${opt === "Yes" ? "border-green-400" : "border-rose-400"}`} />
                                    {opt}
                                  </div>
                                ))}
                                <p className="text-xs text-slate-400 ml-1">Fixed options — not editable</p>
                              </div>
                            )}

                            {/* Single choice options */}
                            {q.type === "single" && (
                              <div className="flex flex-col gap-2">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                                    <input
                                      value={opt}
                                      onChange={(e) => updateOption(q.id, oi, e.target.value)}
                                      placeholder={`Option ${oi + 1}`}
                                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                                    />
                                    {q.options.length > 2 && (
                                      <button onClick={() => removeOption(q.id, oi)} className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors cursor-pointer">
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {q.options.length < 6 && (
                                  <button onClick={() => addOption(q.id)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer mt-1">
                                    <Plus className="w-3.5 h-3.5" /> Add option
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add question buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <p className="text-xs font-semibold text-slate-400 mr-1">Add question:</p>
                  {(["text", "single", "boolean"] as QuestionType[]).map((t) => {
                    const tc = TYPE_CFG[t];
                    return (
                      <button key={t} type="button" onClick={() => addQuestion(t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${tc.color} hover:opacity-80`}>
                        <Plus className="w-3 h-3" />{tc.label}
                      </button>
                    );
                  })}
                </div>

              </div>
            </section>

            {usageLimits && usageLimits.jobsLimit > 0 && usageLimits.jobsUsed >= usageLimits.jobsLimit && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                <span className="text-amber-500 text-lg leading-none shrink-0">⚠</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Job listing limit reached ({usageLimits.jobsUsed}/{usageLimits.jobsLimit})</p>
                  <p className="text-xs text-amber-600 mt-0.5">You cannot publish more jobs on your current plan.</p>
                  <Link href="/employer/subscription?tab=plans" className="text-xs font-semibold text-amber-700 underline mt-1 inline-block">Upgrade plan →</Link>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pb-6">
              <button
                onClick={handlePublish}
                disabled={publishing || savingDraft || !!(usageLimits && usageLimits.jobsLimit > 0 && usageLimits.jobsUsed >= usageLimits.jobsLimit)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                {publishing ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Publish Job
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={publishing || savingDraft}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {savingDraft ? (
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savingDraft ? "Saving…" : "Save as Draft"}
              </button>
            </div>
          </div>

          {/* ── Right: sticky sidebar ────────────────────────────────────────── */}
          <div className="xl:col-span-1 flex flex-col gap-4 sticky top-6">

            {/* Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Listing Checklist</h3>
              <p className="text-[10px] text-slate-400 mb-3">Click any item to jump to that section</p>
              <div className="space-y-1">
                {[
                  { label: "Job title",           done: !!title.trim(),                        section: "section-basics"          },
                  { label: "Domain",              done: !!domain,                              section: "section-basics"          },
                  { label: "Experience level",    done: !!level,                               section: "section-basics"          },
                  { label: "Job type",            done: !!type,                                section: "section-basics"          },
                  { label: "Work mode",           done: !!remote,                              section: "section-basics"          },
                  { label: "Location",            done: true,                                  section: "section-basics"          },
                  { label: "Job description",     done: description.trim().length > 20,        section: "section-description"     },
                  { label: "Responsibilities",    done: responsibilities.some(r => r.trim()),  section: "section-responsibilities" },
                  { label: "Requirements",        done: requirements.some(r => r.trim()),      section: "section-requirements"    },
                  { label: "Skills / tags",       done: tags.length > 0,                       section: "section-skills"          },
                  { label: "Screening questions", done: questions.length > 0,                  section: "section-screening"       },
                ].map(({ label, done, section }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group text-left"
                  >
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      : <Circle       className="w-4 h-4 text-slate-200 group-hover:text-slate-300 shrink-0" />
                    }
                    <span className={`text-xs ${done ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Preview</h3>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900 truncate">{title || <span className="text-slate-300">Job title…</span>}</p>
                <p className="text-xs text-slate-400 mt-0.5">CyberShield Inc.</p>
                <div className="flex flex-wrap gap-2 mt-2.5 text-[11px] text-slate-500">
                  {type   && <span>{type}</span>}
                  {remote && <span>{remote}</span>}
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {tags.slice(0, 4).map((t) => (
                      <span key={t} className="px-2 py-0.5 text-[10px] font-mono text-slate-600 bg-white border border-slate-200 rounded-md">{t}</span>
                    ))}
                    {tags.length > 4 && <span className="text-[10px] text-slate-400">+{tags.length - 4}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Quick publish */}
            <button
              onClick={handlePublish}
              disabled={publishing || savingDraft || !!(usageLimits && usageLimits.jobsLimit > 0 && usageLimits.jobsUsed >= usageLimits.jobsLimit)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              {publishing ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publish Job
            </button>
          </div>

        </div>
      </main>
      </KycGate>
    </>
  );
}
