/* Hallmark · component: job-card-preview · 8-state demonstration wrapper */

"use client";

import JobCard from "./JobCard";
import type { Job } from "@/lib/jobs-data";

const sampleJob: Job = {
  id: "job-demo-1",
  jobCode: "ZEP-0002",
  title: "Application Security Engineer",
  company: "Zepto",
  logo: "Z",
  accent: "bg-blue-100 text-blue-800",
  location: "Batala, Punjab, India",
  remote: "Remote",
  type: "Internship",
  durationMonths: 6,
  domain: "Application Security",
  tags: ["OWASP", "Burp Suite", "Python", "API Security"],
  posted: "9/3/2026",
  description: "Secure core delivery infrastructure, conduct penetration tests, and automate code scanning across our production environments.",
  responsibilities: [],
  requirements: [],
  niceToHave: [],
  companyDescription: "",
  companySize: "1000+",
  companyIndustry: "Quick Commerce",
  isFeatured: true,
};

export default function JobCardPreview() {
  const states = [
    { name: "default", label: "Default state" },
    { name: "hover", label: "Hover state (:hover / .is-hover)" },
    { name: "focus", label: "Focus-visible state (:focus-visible)" },
    { name: "active", label: "Active state (:active / pressed)" },
    { name: "disabled", label: "Disabled state (aria-disabled)" },
    { name: "loading", label: "Loading state (skeleton animation)" },
    { name: "error", label: "Error state (failed to load)" },
    { name: "success", label: "Success state (saved / confirmed)" },
  ] as const;

  return (
    <div className="max-w-xl mx-auto p-8 space-y-8 bg-slate-50 min-h-screen">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 font-mono">JobCard — 8 States Verification</h1>
        <p className="text-xs text-slate-500 font-mono mt-1">Hallmark component-scope tactile review</p>
      </header>

      <div className="space-y-6">
        {states.map((s) => (
          <section key={s.name} className="space-y-2">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
              {s.name} — {s.label}
            </span>
            <JobCard job={sampleJob} state={s.name} />
          </section>
        ))}
      </div>
    </div>
  );
}
