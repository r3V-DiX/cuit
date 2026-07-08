"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Save, ChevronDown, Plus, X, ArrowLeft,
  Users, Eye, CheckCircle2, Sparkles, Wand2,
} from "lucide-react";
import { inferDomain } from "@/lib/jobs-data";
import { useToast } from "@/components/ui/Toast";

const JOB_TYPES    = ["Full-time", "Part-time", "Contract", "Internship"];
const REMOTE_TYPES = ["Remote", "On-site", "Hybrid"];
const LEVELS       = ["Junior (0–2 yrs)", "Mid-level (2–5 yrs)", "Senior (5–8 yrs)", "Lead (8+ yrs)", "Manager (8+ yrs)"];

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 pr-8 cursor-pointer">
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline, rows }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows ?? 4}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 resize-none" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10" />
      )}
    </div>
  );
}

function TagInput({ label, tags, onChange }: { label: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  function add() { const v = input.trim(); if (v && !tags.includes(v)) onChange([...tags, v]); setInput(""); }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-xl min-h-11 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-mono font-medium rounded-lg border border-blue-200">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
          </span>
        ))}
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }}}
          className="flex-1 min-w-30 text-sm bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none px-1 py-0.5" />
      </div>
      <p className="text-[10px] font-mono text-slate-400">Press Enter or comma to add</p>
    </div>
  );
}

export default function JobEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialJob, setInitialJob] = useState<any>(null);

  const [title, setTitle]             = useState("");
  const [domain, setDomain]           = useState("");
  const [type, setType]               = useState("");
  const [level, setLevel]             = useState("");
  const [remote, setRemote]           = useState("");
  const [location, setLocation]       = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [tagsGenerating, setTagsGenerating] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/employer/jobs/${id}`);
        const result = await res.json();
        const rawJob = result.data || result;
        if (rawJob && rawJob.id) {
            setInitialJob(rawJob);
            setTitle(rawJob.jobTitle || "");
            setDomain(rawJob.role?.name || "Cybersecurity");
            
            const typeStr = rawJob.jobType?.replace("_", "-").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Full-time";
            setType(typeStr);

            const modeMapInv: Record<string, string> = { "REMOTE": "Remote", "ONSITE": "On-site", "HYBRID": "Hybrid" };
            setRemote(modeMapInv[rawJob.workMode] || "Remote");

            const levelMapInv: Record<string, string> = { "ENTRY": "Junior (0–2 yrs)", "MID": "Mid-level (2–5 yrs)", "SENIOR": "Senior (5–8 yrs)" };
            setLevel(levelMapInv[rawJob.experienceLevel] || "Mid-level (2–5 yrs)");

            setLocation(rawJob.location?.displayName || "Remote");
            setDescription(rawJob.description || "");
            setTags(rawJob.skills?.map((s: any) => s.skill.name) || []);
        }
      } catch (e: any) {
        toast({ type: "error", message: "Failed to load job" });
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  function generateAITags() {
    setTagsGenerating(true);
    setTimeout(() => {
      const suggested = ["Burp Suite", "Metasploit", "OSCP", "Python", "Web App Testing", "Network Pentesting", "Kali Linux", "Nmap", "AWS Red Team", "Active Directory"];
      setTags((prev) => {
        const merged = [...prev];
        suggested.forEach((t) => { if (!merged.includes(t)) merged.push(t); });
        return merged;
      });
      setTagsGenerating(false);
    }, 1200);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast({ type: "error", message: "Job title is required" });
      return;
    }
    setSaving(true);
    try {
      const csrfCookie = document.cookie.split("; ").find((row) => row.startsWith("csrf_token="));
      const csrfToken = csrfCookie ? decodeURIComponent(csrfCookie.split("=")[1]) : "";

      const typeMap: Record<string, string> = {
        "Full-time": "FULL_TIME",
        "Part-time": "PART_TIME",
        "Contract": "CONTRACT",
        "Internship": "INTERNSHIP"
      };

      const modeMap: Record<string, string> = {
        "Remote": "REMOTE",
        "On-site": "ONSITE",
        "Hybrid": "HYBRID"
      };

      const levelMap: Record<string, string> = {
        "Junior (0–2 yrs)": "ENTRY",
        "Mid-level (2–5 yrs)": "MID",
        "Senior (5–8 yrs)": "SENIOR",
        "Lead (8+ yrs)": "SENIOR",
        "Manager (8+ yrs)": "SENIOR"
      };

      const res = await fetch(`/api/employer/jobs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          jobTitle: title.trim(),
          jobType: typeMap[type],
          workMode: modeMap[remote],
          experienceLevel: levelMap[level],
          description: description.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || result.message || "Failed to save job");
      }

      toast({ type: "success", message: "Job updated successfully!" });
      router.push(`/employer/jobs/${id}`);
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <EmployerTopbar title="Edit Job" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-slate-500 font-medium text-sm">Loading…</p>
          </div>
        </main>
      </>
    );
  }

  const status = initialJob?.status || "DRAFT";
  const statusDisplay = status === "APPROVED" ? "Active" : status === "PENDING" ? "Pending" : status === "DRAFT" ? "Draft" : "Closed";

  return (
    <>
      <EmployerTopbar title="Edit Job" />
      <main className="flex-1 overflow-y-auto p-6">

        <Link href={`/employer/jobs/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Job Details
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

          {/* ── Left: form ──────────────────────────────────────────────────── */}
          <div className="xl:col-span-2 flex flex-col gap-5">
            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Basic Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <TextField label="Job Title" value={title} onChange={setTitle} placeholder="e.g. Senior Penetration Tester" />
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
                      onClick={() => { const inferred = inferDomain(title); if (inferred) setDomain(inferred); }}
                      title="Auto-infer domain from job title"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors cursor-pointer shrink-0"
                    >
                      <Wand2 className="w-3.5 h-3.5" /> AI Fill
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">Edit manually or click AI Fill to detect from title</p>
                </div>
                <SelectField label="Experience Level" value={level} onChange={setLevel} options={LEVELS} />
                <SelectField label="Job Type" value={type} onChange={setType} options={JOB_TYPES} />
                <SelectField label="Work Mode" value={remote} onChange={setRemote} options={REMOTE_TYPES} />
                <TextField label="Location" value={location} onChange={setLocation} placeholder="e.g. Remote / New York, NY" />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Job Description</h2>
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" /> AI Redraft
                </button>
              </div>
              <TextField label="Overview" value={description} onChange={setDescription} multiline rows={6} />
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6">
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
              <TagInput label="Skills / tools" tags={tags} onChange={setTags} />
            </section>

            <div className="flex items-center gap-3 pb-6">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-70">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* ── Right: sticky sidebar ────────────────────────────────────────── */}
          <div className="xl:col-span-1 flex flex-col gap-4 sticky top-6">

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">{initialJob?._count?.applications || 0}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Users className="w-3 h-3" /> Applicants</p>
                </div>
                <div className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">{initialJob?.viewCount || 0}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Eye className="w-3 h-3" /> Views</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1
                   ${statusDisplay === "Active" ? "text-green-700 bg-green-50 border-green-200" 
                     : statusDisplay === "Draft" ? "text-slate-500 bg-slate-50 border-slate-200" 
                     : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                  <CheckCircle2 className="w-3 h-3" /> {statusDisplay}
                </span>
                <Link href={`/employer/jobs/${id}/applicants`} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  View applicants →
                </Link>
              </div>
            </div>

            {/* Quick save */}
            <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-70">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
