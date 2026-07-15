"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Save, ChevronDown, Plus, X, Camera,
  CheckCircle2, AlertCircle, PlusCircle, ArrowRight, Loader2,
  ShieldAlert, ShieldCheck, Clock,
} from "lucide-react";
import { apiFetch, authHeaders, getCsrf } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { LocationSelect, LocationValue } from "@/components/ui/LocationSelect";
import { useKycContext } from "@/lib/employer-context";

const INDUSTRIES = [
  { id: "TECHNOLOGY", label: "Technology" },
  { id: "HEALTHCARE", label: "Healthcare" },
  { id: "FINANCE", label: "Finance" },
  { id: "EDUCATION", label: "Education" },
  { id: "RETAIL", label: "Retail" },
  { id: "MANUFACTURING", label: "Manufacturing" },
  { id: "CONSULTING", label: "Consulting" },
  { id: "OTHER", label: "Other" },
];

const SIZES = [
  { id: "SIZE_1_10", label: "1–10 employees" },
  { id: "SIZE_11_50", label: "11–50 employees" },
  { id: "SIZE_51_200", label: "51–200 employees" },
  { id: "SIZE_201_500", label: "201–500 employees" },
  { id: "SIZE_501_1000", label: "501–1000 employees" },
  { id: "SIZE_1000_PLUS", label: "1000+ employees" },
];

const inputCls = "w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400";
const labelCls = "block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5";
const selectCls = "w-full h-10 pl-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-b border-slate-100 last:border-0">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

const COMPLETION_CHECKS: { key: string; label: string; required: boolean }[] = [
  { key: "name",      label: "Company name",       required: true  },
  { key: "industry",  label: "Industry",            required: true  },
  { key: "size",      label: "Company size",        required: true  },
  { key: "website",   label: "Website URL",         required: true  },
  { key: "bio",       label: "Company bio",         required: true  },
  { key: "location",  label: "Headquarters",        required: false },
  { key: "culture",   label: "Culture description", required: false },
  { key: "perks",     label: "Perks & benefits",    required: false },
  { key: "linkedin",  label: "LinkedIn page",       required: false },
  { key: "logo",      label: "Company logo",        required: false },
];

type Perk = { id?: string; name: string };

export default function CompanyProfilePage() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const { toast } = useToast();
  const { status: kycCtx, rejectionReason: kycRejectionReason } = useKycContext();
  const kycStatus =
    kycCtx === "verified"      ? "APPROVED"     :
    kycCtx === "pending"       ? "PENDING"      :
    kycCtx === "under_review"  ? "UNDER_REVIEW" :
    kycCtx === "rejected"      ? "REJECTED"     :
    "NOT_SUBMITTED";
  const [name, setName]         = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize]         = useState("");
  const [website, setWebsite]   = useState("");
  const [location, setLocation] = useState<LocationValue>({ city: "", state: "", country: "" });
  const [founded, setFounded]   = useState("");
  const [bio, setBio]           = useState("");
  const [culture, setCulture]   = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter]   = useState("");
  const [perks, setPerks]       = useState<Perk[]>([]);
  const [perkInput, setPerkInput] = useState("");
  const [logoUrl, setLogoUrl]   = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const logoInputRef            = useRef<HTMLInputElement>(null);

  const hasLogo = !!logoUrl;

  useEffect(() => {
    apiFetch("/api/employer/company/me")
      .then((res) => {
        const d: any = res.data ?? res;
        setName(d.companyName ?? d.name ?? "");
        setIndustry(d.industry ?? "");
        setSize(d.companySize ?? d.size ?? "");
        setWebsite(d.companyWebsite ?? d.website ?? "");
        
        const locStr = d.location ?? d.headquarters ?? "";
        const parts = locStr.split(",").map((p: string) => p.trim());
        let lCity = "", lState = "", lCountry = "";
        if (parts.length === 3) {
          lCity = parts[0]; lState = parts[1]; lCountry = parts[2];
        } else if (parts.length === 2) {
          lCity = parts[0]; lCountry = parts[1];
        } else {
          lCity = parts[0] || ""; lCountry = parts[0] || "";
        }
        setLocation({ city: lCity, state: lState, country: lCountry });

        setFounded(d.foundedYear ? String(d.foundedYear) : d.founded ? String(d.founded) : "");
        setBio(d.about ?? d.bio ?? d.description ?? "");
        setCulture(d.cultureDescription ?? d.culture ?? "");
        setLinkedin(d.linkedin ?? d.linkedinUrl ?? "");
        setTwitter(d.twitter ?? d.twitterUrl ?? "");
        const raw = d.benefits ?? d.EmployerBenefit ?? d.perks ?? [];
        setPerks(
          Array.isArray(raw)
            ? raw.map((p: any) =>
                typeof p === "string" ? { name: p } : { id: p.id, name: p.title ?? p.name ?? p.label }
              )
            : []
        );
        if (d.companyLogo || d.logoUrl) setLogoUrl(d.companyLogo || d.logoUrl);
        if (d.verifiedAt) setVerifiedAt(d.verifiedAt);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        apiFetch("/api/employer/company/basic", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            companyName: name || undefined,
            industry: industry || undefined,
            companySize: size || undefined,
            companyWebsite: website.trim()
              ? /^https?:\/\//i.test(website.trim()) ? website.trim() : `https://${website.trim()}`
              : undefined,
            location: [location.city, location.state, location.country].filter(Boolean).join(", ") || undefined,
            foundedYear: parseInt(founded) || undefined,
          }),
        }),
        apiFetch("/api/employer/company/about", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ about: bio, cultureDescription: culture }),
        }),
        apiFetch("/api/employer/company/social", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            linkedin: linkedin.trim()
              ? /^https?:\/\//i.test(linkedin.trim()) ? linkedin.trim() : `https://${linkedin.trim()}`
              : undefined,
            twitter: twitter.trim() || undefined,
          }),
        }),
      ]);
      toast({ type: "success", message: "Company profile saved" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile";
      toast({ type: "error", message: "Save failed", description: msg });
    } finally {
      setSaving(false);
    }
  }

  async function addPerk() {
    const v = perkInput.trim();
    if (!v || perks.some((p) => p.name === v)) return;
    setPerkInput("");
    try {
      const benefitRes = await apiFetch("/api/employer/company/benefits", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title: v, description: "" }),
      });
      const benefitResData = benefitRes as any;
      const perkId = benefitResData?.data?.id ?? benefitResData?.id ?? undefined;
      setPerks((prev) => [...prev, { id: perkId, name: v }]);
      toast({ type: "success", message: `Perk "${v}" added` });
    } catch (err: unknown) {
      setPerks((prev) => [...prev, { name: v }]);
      const msg = err instanceof Error ? err.message : "Could not save perk to server";
      toast({ type: "error", message: "Perk save failed", description: msg });
    }
  }

  async function removePerk(perk: Perk) {
    setPerks((prev) => prev.filter((p) => p !== perk));
    if (perk.id) {
      await apiFetch(`/api/employer/company/benefits/${perk.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Could not remove perk";
        toast({ type: "error", message: "Remove perk failed", description: msg });
      });
    }
  }

const LOGO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
      toast({ type: "error", message: "Invalid file type", description: "Only JPEG, PNG, WebP, or GIF images are allowed." });
      e.target.value = "";
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast({ type: "error", message: "File too large", description: "Logo must be smaller than 5 MB." });
      e.target.value = "";
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiFetch("/api/employer/company/logo", {
        method: "POST",
        headers: { "x-csrf-token": getCsrf() },
        body: fd,
      });
      const data: any = res.data ?? res;
      if (data.companyLogo || data.url) setLogoUrl(data.companyLogo || data.url);
      toast({ type: "success", message: "Logo uploaded" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ type: "error", message: "Logo upload failed", description: msg });
    }
    e.target.value = "";
  }

  // Completion scoring
  const fieldValues: Record<string, boolean> = {
    name:     !!name.trim(),
    industry: !!industry,
    size:     !!size,
    website:  !!website.trim(),
    bio:      bio.trim().length > 30,
    location: !!location.city && !!location.country,
    culture:  culture.trim().length > 20,
    perks:    perks.length > 0,
    linkedin: !!linkedin.trim(),
    logo:     hasLogo,
  };
  const totalChecks     = COMPLETION_CHECKS.length;
  const completedChecks = COMPLETION_CHECKS.filter((c) => fieldValues[c.key]).length;
  const pct             = Math.round((completedChecks / totalChecks) * 100);
  const canPostJob      = pct >= 50;

  if (loading) {
    return (
      <>
        <EmployerTopbar title="Company Profile" />
        <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <EmployerTopbar title="Company Profile" />

      {/* KYC status banner */}
      {kycStatus === "NOT_SUBMITTED" && (
        <div className="mx-6 mt-4 flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">KYC verification required</p>
            <p className="text-xs text-amber-700 mt-0.5">You can fill your company profile here, but job posting is locked until KYC is approved.</p>
          </div>
          <Link href="/kyc/employer" className="shrink-0 h-8 px-3 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors flex items-center gap-1.5">
            Complete KYC <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
      {(kycStatus === "PENDING" || kycStatus === "UNDER_REVIEW") && (
        <div className="mx-6 mt-4 flex items-start gap-3 px-5 py-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800">Verification under review</p>
            <p className="text-xs text-blue-700 mt-0.5">Your KYC documents are being reviewed. Job posting unlocks once approved (1–2 business days).</p>
          </div>
        </div>
      )}
      {kycStatus === "REJECTED" && (
        <div className="mx-6 mt-4 flex items-start gap-3 px-5 py-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-800">Verification rejected</p>
            {kycRejectionReason && (
              <p className="text-xs text-rose-700 mt-0.5">{kycRejectionReason}</p>
            )}
            <p className="text-xs text-rose-600 mt-1">Fix the issue and resubmit your documents to unlock job posting.</p>
          </div>
          <Link href="/kyc/employer" className="shrink-0 h-8 px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1.5">
            Resubmit <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
      {kycStatus === "APPROVED" && (
        <div className="mx-6 mt-4 flex items-center gap-3 px-5 py-3.5 bg-green-50 border border-green-200 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm font-semibold text-green-800">Organisation verified — job posting is active</p>
        </div>
      )}
      {kycStatus === "APPROVED" && verifiedAt && (() => {
        const msElapsed = Date.now() - new Date(verifiedAt).getTime();
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        if (msElapsed > THREE_DAYS_MS) return null;
        return (
          <div className="mx-6 mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl shadow-sm w-fit">
            <ShieldCheck className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-bold text-white tracking-wide">Organisation verified</span>
          </div>
        );
      })()}

      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

          {/* ── Left: form ──────────────────────────────────────────────────── */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">

            {/* Logo */}
            <Section title="Logo & Branding" desc="Upload your company logo so candidates can recognise your brand.">
              <div className="flex items-center gap-5 flex-wrap">
                <div className="relative">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-100" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                      {name ? name.slice(0, 2).toUpperCase() : "CO"}
                    </div>
                  )}
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{name || "Your Company"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{INDUSTRIES.find(i => i.id === industry)?.label || industry} · {[location.city, location.state, location.country].filter(Boolean).join(", ") || "—"}</p>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
                    Upload logo
                  </button>
                </div>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </Section>

            {/* Basic info */}
            <Section title="Basic Information" desc="Core details shown on all job listings and your public company page.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Company Name <span className="text-rose-400">*</span></label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CyberShield Inc." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Industry <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={selectCls}>
                      <option value="">Select industry...</option>
                      {INDUSTRIES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Company Size <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <select value={size} onChange={(e) => setSize(e.target.value)} className={selectCls}>
                      <option value="">Select size...</option>
                      {SIZES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <LocationSelect value={location} onChange={setLocation} />
                </div>
                <div>
                  <label className={labelCls}>Founded</label>
                  <input value={founded} onChange={(e) => setFounded(e.target.value)} placeholder="e.g. 2015" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Website <span className="text-rose-400">*</span></label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className={inputCls} />
                </div>
              </div>
            </Section>

            {/* About */}
            <Section title="About the Company" desc="Describe your company to attract the right candidates.">
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Company Bio <span className="text-rose-400">*</span></label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                    placeholder="Describe what your company does, your mission, and what makes you different…"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white resize-none transition-all" />
                  <p className="text-[10px] font-mono text-slate-400 mt-1">{bio.length} / 500 chars</p>
                </div>
                <div>
                  <label className={labelCls}>Culture & Work Environment</label>
                  <textarea value={culture} onChange={(e) => setCulture(e.target.value)} rows={3}
                    placeholder="Describe your team culture, work style, and values…"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white resize-none transition-all" />
                </div>
              </div>
            </Section>

            {/* Perks */}
            <Section title="Perks & Benefits" desc="Help candidates understand what it's like to work at your company.">
              <div className="flex flex-wrap gap-2 mb-3">
                {perks.map((p) => (
                  <span key={p.id ?? p.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-xl border border-blue-200">
                    {p.name}
                    <button onClick={() => removePerk(p)} className="hover:text-blue-900 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input value={perkInput} onChange={(e) => setPerkInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPerk(); }}}
                  placeholder="Add a perk (e.g. Remote-first, Cert reimbursement)…"
                  className={`${inputCls} flex-1`} />
                <button onClick={addPerk} className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </Section>

            {/* Social */}
            <Section title="Social & Links">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>LinkedIn</label>
                  <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/…" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Twitter / X</label>
                  <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/…" className={inputCls} />
                </div>
              </div>
            </Section>

            {/* Save */}
            <div className="px-6 py-5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </div>

          {/* ── Right: sticky sidebar ────────────────────────────────────────── */}
          <div className="xl:col-span-1 flex flex-col gap-4 sticky top-6">

            {/* Profile completion */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-slate-900">Profile Completion</h3>
                <span className={`text-sm font-bold font-mono ${pct >= 50 ? "text-green-600" : "text-amber-500"}`}>{pct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct >= 50 ? "bg-green-500" : "bg-amber-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="space-y-2">
                {COMPLETION_CHECKS.map((c) => {
                  const done = fieldValues[c.key];
                  return (
                    <div key={c.key} className="flex items-center gap-2.5">
                      {done
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        : <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${c.required ? "border-amber-300" : "border-slate-200"}`} />
                      }
                      <span className={`text-xs ${done ? "text-slate-700" : c.required ? "text-amber-600 font-medium" : "text-slate-400"}`}>
                        {c.label}
                        {c.required && !done && <span className="text-amber-400 ml-0.5">*</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Post job gate */}
            <div className={`rounded-2xl border p-5 ${canPostJob ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-start gap-3">
                {canPostJob
                  ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  : <AlertCircle  className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                }
                <div>
                  <p className={`text-sm font-semibold ${canPostJob ? "text-green-800" : "text-amber-800"}`}>
                    {canPostJob ? "Ready to post jobs" : "50% required to post jobs"}
                  </p>
                  <p className={`text-xs mt-0.5 leading-relaxed ${canPostJob ? "text-green-600" : "text-amber-600"}`}>
                    {canPostJob
                      ? "Your profile is complete enough. Candidates can now see your company info on job listings."
                      : `Complete ${50 - pct}% more to unlock job posting. Fill in the required fields marked with *.`}
                  </p>
                  {canPostJob ? (
                    <Link
                      href="/employer/jobs/new"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800 transition-colors"
                    >
                      Post a job <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(pct / 50) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-600">{pct}/50%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">How candidates see you</h3>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                  {name ? name.slice(0, 2).toUpperCase() : "CO"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{name || "Your Company"}</p>
                  <p className="text-xs text-slate-400">{INDUSTRIES.find(i => i.id === industry)?.label || industry} · {SIZES.find(s => s.id === size)?.label || size}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">{bio || "Company bio will appear here…"}</p>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
