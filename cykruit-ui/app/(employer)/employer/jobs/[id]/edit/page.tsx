"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Save, ChevronDown, Plus, X, ArrowLeft,
  Users, Eye, CheckCircle2, Info, Sparkles, Loader2, MapPin,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders } from "@/lib/api";

const JOB_TYPES    = ["Full-time", "Part-time", "Contract", "Internship"];
const REMOTE_TYPES = ["Remote", "On-site", "Hybrid"];
const LEVELS       = ["Junior (0–2 yrs)", "Mid-level (2–5 yrs)", "Senior (5+ yrs)"];

const DESC_MIN = 50;

interface OfficeLocation {
  id: string;
  type: string;
  city: string;
  state?: string;
  country: string;
  isHeadquarters: boolean;
}

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
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-blue-900 cursor-pointer"><X className="w-3 h-3" /></button>
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

function SaveButton({ onClick, saving, descTooShort }: { onClick: () => void; saving: boolean; descTooShort: boolean }) {
  const [showTip, setShowTip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick() {
    if (descTooShort) {
      setShowTip(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowTip(false), 3000);
      return;
    }
    onClick();
  }

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleClick}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-70"
      >
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
      </button>
      {showTip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 px-3 py-2 bg-slate-800 text-white text-xs rounded-xl shadow-lg z-50 text-center">
          <Info className="w-3 h-3 inline mr-1 text-amber-400" />
          Description needs at least {DESC_MIN} characters.
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

export default function JobEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialJob, setInitialJob] = useState<Record<string, unknown> | null>(null);

  const [title, setTitle]             = useState("");
  const [type, setType]               = useState("");
  const [level, setLevel]             = useState("");
  const [remote, setRemote]           = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags]               = useState<string[]>([]);

  // Read-only display fields
  const [domainDisplay, setDomainDisplay] = useState("");

  // Office location
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [selectedOfficeLocationId, setSelectedOfficeLocationId] = useState<string>("REMOTE");

  // AI state
  const [aiRedrafting, setAiRedrafting] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [jobResult, companyResult] = await Promise.all([
          apiFetch(`/api/employer/jobs/${id}`),
          apiFetch(`/api/employer/company/me`).catch(() => null),
        ]);

        const rawJob = (jobResult.data || jobResult) as Record<string, unknown>;
        if (rawJob && rawJob.id) {
          setInitialJob(rawJob);
          setTitle((rawJob.jobTitle as string) || "");
          setDomainDisplay((rawJob as { role?: { name?: string } }).role?.name || "");

          const typeBackToDisplay: Record<string, string> = {
            "FULL_TIME": "Full-time",
            "PART_TIME": "Part-time",
            "CONTRACT": "Contract",
            "INTERNSHIP": "Internship",
          };
          setType(typeBackToDisplay[(rawJob.jobType as string) || ""] || "Full-time");

          const modeBackToDisplay: Record<string, string> = {
            "REMOTE": "Remote",
            "ONSITE": "On-site",
            "HYBRID": "Hybrid",
          };
          setRemote(modeBackToDisplay[(rawJob.workMode as string) || ""] || "Remote");

          const levelBackToDisplay: Record<string, string> = {
            "ENTRY":  "Junior (0–2 yrs)",
            "MID":    "Mid-level (2–5 yrs)",
            "SENIOR": "Senior (5+ yrs)",
          };
          setLevel(levelBackToDisplay[(rawJob.experienceLevel as string) || ""] || "Mid-level (2–5 yrs)");

          setDescription((rawJob.description as string) || "");
          setTags(
            ((rawJob as { skills?: { skill: { name: string } }[] }).skills || []).map((s) => s.skill.name)
          );
        }

        if (companyResult) {
          const raw = (companyResult.data || companyResult) as Record<string, unknown>;
          const locs = (raw.officeLocations as OfficeLocation[] | undefined) || [];
          setOfficeLocations(locs);
        }
      } catch {
        toast({ type: "error", message: "Failed to load job" });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const descTooShort = description.trim().length < DESC_MIN;

  async function handleAiRedraft() {
    if (!title.trim()) { toast({ type: "error", message: "Add a job title first" }); return; }
    setAiRedrafting(true);
    try {
      const res = await apiFetch(`/api/employer/jobs/improve-description`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title: title.trim(), description: description.trim(), jobType: type, experienceLevel: level }),
      });
      const improved = (res as { description?: string }).description || (res as { data?: { description?: string } }).data?.description;
      if (improved) { setDescription(improved); toast({ type: "success", message: "Description improved!" }); }
    } catch { toast({ type: "error", message: "AI redraft failed" }); }
    finally { setAiRedrafting(false); }
  }

  async function handleAiSuggest() {
    if (!title.trim()) { toast({ type: "error", message: "Add a job title first" }); return; }
    setAiSuggesting(true);
    try {
      const res = await apiFetch(`/api/employer/jobs/suggest-skills`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const suggested: string[] = (res as { skills?: string[] }).skills || (res as { data?: { skills?: string[] } }).data?.skills || [];
      if (suggested.length > 0) {
        setTags((prev) => [...new Set([...prev, ...suggested])]);
        toast({ type: "success", message: `Added ${suggested.length} skill suggestions` });
      }
    } catch { toast({ type: "error", message: "AI suggest failed" }); }
    finally { setAiSuggesting(false); }
  }

  async function handleSave() {
    if (!title.trim()) {
      toast({ type: "error", message: "Job title is required" });
      return;
    }
    if (descTooShort) {
      toast({ type: "error", message: `Description needs at least ${DESC_MIN} characters` });
      return;
    }
    setSaving(true);
    try {
      const typeMap: Record<string, string> = {
        "Full-time": "FULL_TIME",
        "Part-time": "PART_TIME",
        "Contract":  "CONTRACT",
        "Internship": "INTERNSHIP",
      };
      const modeMap: Record<string, string> = {
        "Remote":  "REMOTE",
        "On-site": "ONSITE",
        "Hybrid":  "HYBRID",
      };
      const levelMap: Record<string, string> = {
        "Junior (0–2 yrs)":    "ENTRY",
        "Mid-level (2–5 yrs)": "MID",
        "Senior (5+ yrs)":     "SENIOR",
      };

      await apiFetch(`/api/employer/jobs/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          jobTitle:        title.trim(),
          jobType:         typeMap[type],
          workMode:        modeMap[remote],
          experienceLevel: levelMap[level],
          description:     description.trim(),
          skillNames:      tags,
        }),
      });

      toast({ type: "success", message: "Job updated successfully!" });
      router.push(`/employer/jobs/${id}`);
    } catch (err: unknown) {
      toast({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
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

  const status = (initialJob?.status as string) || "DRAFT";
  const statusDisplay = status === "APPROVED" ? "Active" : status === "PENDING" ? "Pending" : status === "DRAFT" ? "Draft" : "Closed";

  const locationOptions: { value: string; label: string }[] = [
    { value: "REMOTE", label: "Remote" },
    ...officeLocations.map((loc) => ({
      value: loc.id,
      label: `${loc.city}${loc.state ? `, ${loc.state}` : ""}, ${loc.country}${loc.isHeadquarters ? " (HQ)" : ""}`,
    })),
  ];

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

                {domainDisplay && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Domain</label>
                    <div className="h-10 px-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center text-sm text-slate-500 select-none">
                      {domainDisplay}
                    </div>
                    <p className="text-[10px] font-mono text-slate-400">Managed via job category — contact support to change</p>
                  </div>
                )}

                <SelectField label="Experience Level" value={level} onChange={setLevel} options={LEVELS} />
                <SelectField label="Job Type" value={type} onChange={setType} options={JOB_TYPES} />
                <SelectField label="Work Mode" value={remote} onChange={setRemote} options={REMOTE_TYPES} />

                {/* Office location dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedOfficeLocationId}
                      onChange={(e) => setSelectedOfficeLocationId(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
                    >
                      {locationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {officeLocations.length === 0 && (
                    <p className="text-[10px] font-mono text-slate-400">Add office locations in company settings to enable location selection</p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-slate-900">Job Description</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${descTooShort ? "text-rose-500" : "text-slate-400"}`}>
                    {description.trim().length}/{DESC_MIN} min
                  </span>
                  <button
                    type="button"
                    onClick={handleAiRedraft}
                    disabled={aiRedrafting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {aiRedrafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Redraft
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3">Minimum {DESC_MIN} characters required.</p>
              <TextField label="" value={description} onChange={setDescription} multiline rows={10}
                placeholder="Describe the role, responsibilities, requirements, and what makes this opportunity exciting…" />
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Skills & Tags</h2>
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiSuggesting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {aiSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Suggest
                </button>
              </div>
              <TagInput label="Skills / tools" tags={tags} onChange={setTags} />
            </section>

            <div className="flex items-center gap-3 pb-6">
              <SaveButton onClick={handleSave} saving={saving} descTooShort={descTooShort} />
            </div>
          </div>

          {/* ── Right: sticky sidebar ────────────────────────────────────────── */}
          <div className="xl:col-span-1 flex flex-col gap-4 sticky top-6">

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">{(initialJob as { _count?: { applications?: number } })?._count?.applications || 0}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Users className="w-3 h-3" /> Applicants</p>
                </div>
                <div className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">{(initialJob?.viewCount as number) || 0}</p>
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
                <Link href={`/employer/jobs/${id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  View applicants →
                </Link>
              </div>
            </div>

            <SaveButton onClick={handleSave} saving={saving} descTooShort={descTooShort} />
          </div>

        </div>
      </main>
    </>
  );
}
