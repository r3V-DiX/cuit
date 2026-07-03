"use client";

import { use, useState } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Save, ChevronDown, Plus, X, ArrowLeft,
  Users, Eye, CheckCircle2, Sparkles, Wand2,
} from "lucide-react";
import { inferDomain } from "@/lib/jobs-data";

const JOB_TYPES    = ["Full-time", "Part-time", "Contract", "Internship"];
const REMOTE_TYPES = ["Remote", "On-site", "Hybrid"];
const LEVELS       = ["Junior (0–2 yrs)", "Mid-level (2–5 yrs)", "Senior (5–8 yrs)", "Lead (8+ yrs)", "Manager (8+ yrs)"];

// Seed data — replace with real fetch by id
const SEED = {
  title:           "Senior Penetration Tester",
  domain:          "Offensive Security",
  type:            "Full-time",
  level:           "Senior",
  remote:          "Remote",
  location:        "Remote",
  description:     "We are looking for an experienced penetration tester to join our red team. You will conduct assessments across web, mobile, and cloud environments.",
  responsibilities:["Conduct penetration tests on web and mobile applications", "Write detailed technical reports", "Collaborate with the blue team on remediation"],
  requirements:    ["3+ years of penetration testing experience", "Proficiency with Burp Suite, Metasploit, and custom exploits"],
  niceToHave:      ["OSCP or GPEN certification", "Bug bounty track record"],
  tags:            ["Burp Suite", "OSCP", "Python", "AWS", "Red Team"],
  applicants:      12,
  views:           340,
  status:          "Active" as const,
};

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 pr-8 cursor-pointer">
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
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
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

function ListInput({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (i: string[]) => void; placeholder?: string;
}) {
  function update(idx: number, val: string) { const next = [...items]; next[idx] = val; onChange(next); }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input value={item} onChange={(e) => update(idx, e.target.value)} placeholder={placeholder}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10" />
            <button onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ""])}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      </div>
    </div>
  );
}

export default function JobEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = use(params);

  const [title, setTitle]             = useState(SEED.title);
  const [domain, setDomain]           = useState(SEED.domain);
  const [type, setType]               = useState(SEED.type);
  const [level, setLevel]             = useState(SEED.level);
  const [remote, setRemote]           = useState(SEED.remote);
  const [location, setLocation]       = useState(SEED.location);
  const [description, setDescription] = useState(SEED.description);
  const [responsibilities, setResp]   = useState(SEED.responsibilities);
  const [requirements, setReqs]       = useState(SEED.requirements);
  const [niceToHave, setNice]         = useState(SEED.niceToHave);
  const [tags, setTags]               = useState(SEED.tags);
  const [tagsGenerating, setTagsGenerating] = useState(false);

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

  return (
    <>
      <EmployerTopbar title="Edit Job" />
      <main className="flex-1 overflow-y-auto p-6">

        <Link href="/employer/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to My Jobs
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
              <h2 className="text-sm font-bold text-slate-900 mb-4">Responsibilities</h2>
              <ListInput label="What will this person do?" items={responsibilities} onChange={setResp} placeholder="Add a responsibility…" />
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Requirements</h2>
              <div className="flex flex-col gap-4">
                <ListInput label="Must-have requirements" items={requirements} onChange={setReqs} placeholder="Add a requirement…" />
                <ListInput label="Nice to have" items={niceToHave} onChange={setNice} placeholder="Add a nice-to-have…" />
              </div>
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
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer">
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 transition-colors cursor-pointer">
                Close Job
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
                  <p className="text-2xl font-bold text-slate-900">{SEED.applicants}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Users className="w-3 h-3" /> Applicants</p>
                </div>
                <div className="flex flex-col items-center justify-center py-3 px-2 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">{SEED.views}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Eye className="w-3 h-3" /> Views</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border text-green-700 bg-green-50 border-green-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {SEED.status}
                </span>
                <Link href="/employer/applicants" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  View applicants →
                </Link>
              </div>
            </div>

            {/* Status control */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Listing Status</h3>
              <div className="flex flex-col gap-2">
                {(["Active", "Draft", "Closed"] as const).map((s) => (
                  <button key={s}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      SEED.status === s
                        ? s === "Active" ? "bg-green-50 border-green-300 text-green-700" : "bg-slate-100 border-slate-300 text-slate-700"
                        : "border-slate-200 text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${s === "Active" ? "bg-green-500" : s === "Draft" ? "bg-slate-400" : "bg-rose-400"}`} />
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick save */}
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
