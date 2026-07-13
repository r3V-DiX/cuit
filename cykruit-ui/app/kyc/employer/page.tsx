"use client";

import { useState, useRef, useEffect } from "react";
import {
  Building2, FileText, CheckCircle2, ChevronRight,
  Upload, X, Shield, AlertCircle, ArrowRight, ChevronLeft, LogOut, Loader2,
} from "lucide-react";
import { useModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { apiFetch, authHeaders, getCsrf, ApiError } from "@/lib/api";

type Step = 1 | 2 | 3;

const COMPANY_TYPES: { label: string; value: string; key: string }[] = [
  { label: "Private Limited Company",  value: "PRIVATE_LIMITED_COMPANY", key: "PRIVATE_LIMITED_COMPANY" },
  { label: "Public Limited Company",   value: "PUBLIC_LIMITED_COMPANY",  key: "PUBLIC_LIMITED_COMPANY"  },
  { label: "Partnership Firm",         value: "PARTNERSHIP_FIRM",        key: "PARTNERSHIP_FIRM"        },
  { label: "Sole Proprietorship",      value: "SOLE_PROPRIETORSHIP",     key: "SOLE_PROPRIETORSHIP"     },
  { label: "LLP",                      value: "OTHERS",                  key: "LLP"                     },
  { label: "NGO / Non-Profit",         value: "NGO",                     key: "NGO"                     },
  { label: "Educational Institution",  value: "EDUCATIONAL_INSTITUTION", key: "EDUCATIONAL_INSTITUTION" },
  { label: "Government / PSU",         value: "NATIONALISED_BANK",       key: "NATIONALISED_BANK"       },
  { label: "Others",                   value: "OTHERS",                  key: "OTHERS"                  },
];

const INDUSTRIES: { label: string; value: string }[] = [
  { label: "Technology",    value: "TECHNOLOGY"    },
  { label: "Healthcare",    value: "HEALTHCARE"    },
  { label: "Finance",       value: "FINANCE"       },
  { label: "Education",     value: "EDUCATION"     },
  { label: "Retail",        value: "RETAIL"        },
  { label: "Manufacturing", value: "MANUFACTURING" },
  { label: "Consulting",    value: "CONSULTING"    },
  { label: "Other",         value: "OTHER"         },
];

const COMPANY_SIZES: { label: string; value: string }[] = [
  { label: "1–10",     value: "SIZE_1_10"      },
  { label: "11–50",    value: "SIZE_11_50"     },
  { label: "51–200",   value: "SIZE_51_200"    },
  { label: "201–500",  value: "SIZE_201_500"   },
  { label: "501–1000", value: "SIZE_501_1000"  },
  { label: "1000+",    value: "SIZE_1000_PLUS" },
];

const DOC_TYPES = [
  "Certificate of Incorporation",
  "Business Registration Certificate",
  "GST / VAT Registration",
  "Tax Identification Document",
  "Business License",
];

const inputCls = "w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400";
const selectCls = "w-full h-11 pl-3.5 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-400 focus:bg-white appearance-none cursor-pointer transition-all";

const STEPS = [
  { n: 1, label: "Organization Details", icon: Building2    },
  { n: 2, label: "KYC Document",         icon: FileText     },
  { n: 3, label: "Submitted",            icon: CheckCircle2 },
];

export default function EmployerKYCPage() {
  const [step, setStep]                 = useState<Step>(1);
  const [checkingStatus, setChecking]   = useState(true);
  const router                          = useRouter();
  const { openModal }                   = useModal();
  const { toast }                       = useToast();

  useEffect(() => {
    async function checkStatus() {
      try {
        const { data } = await apiFetch("/api/employer/kyc/status");
        if (data?.isVerified) { router.replace("/employer/dashboard"); return; }
        const vs = data?.verification?.status;
        if (vs === "PENDING" || vs === "UNDER_REVIEW") { setStep(3); }
        else if (data?.companyId) { setStep(2); }
      } catch (err: any) {
        // COMPANY_NOT_FOUND is expected on first visit — stay on step 1
        if (err?.code !== "COMPANY_NOT_FOUND") {
          toast({ type: "error", message: "Could not check verification status. Please refresh." });
        }
      } finally { setChecking(false); }
    }
    checkStatus();
  }, [router]);

  function handleLogout() {
    openModal({
      variant: "danger",
      title: "Sign out?",
      description: "You'll need to sign back in to continue verification.",
      confirmLabel: "Sign out",
      onConfirm: async () => {
        try {
          await apiFetch("/api/auth/logout", { method: "POST", headers: authHeaders() });
          ["cykruit_applications","cykruit_saved_jobs","cykruit_messages","cykruit_notifications","cykruit_employer_notifications"]
            .forEach((k) => localStorage.removeItem(k));
          toast({ type: "success", message: "Logged out successfully" });
          router.push("/login");
        } catch { toast({ type: "error", message: "Logout request failed" }); }
      },
    });
  }

  const DRAFT_KEY = "cykruit_kyc_draft";

  function loadDraft() {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}"); } catch { return {}; }
  }
  function saveDraft(patch: Record<string, string>) {
    try {
      const cur = loadDraft();
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...cur, ...patch }));
    } catch {}
  }
  function clearDraft() { try { sessionStorage.removeItem(DRAFT_KEY); } catch {} }

  const draft = loadDraft();

  // Step 1 state — seed from draft
  const [legalName,    setLegalName]    = useState(draft.legalName    ?? "");
  const [location,     setLocation]     = useState(draft.location     ?? "");
  const [companyType,  setCompanyType]  = useState(draft.companyType  ?? "");
  const [industry,     setIndustry]     = useState(draft.industry     ?? "");
  const [companySize,  setCompanySize]  = useState(draft.companySize  ?? "");
  const [website,      setWebsite]      = useState(draft.website      ?? "");
  const [contactEmail, setContactEmail] = useState(draft.contactEmail ?? "");
  const [savingOrg,    setSavingOrg]    = useState(false);

  // Step 2 state
  const [docType,    setDocType]    = useState("");
  const [file,       setFile]       = useState<File | null>(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const step1Valid = legalName.trim() && location.trim() && companyType && industry && companySize;
  const step2Valid = docType && file;

  const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);
  const MAX_FILE_BYTES = 10 * 1024 * 1024;

  function validateAndSetFile(f: File) {
    if (f.size > MAX_FILE_BYTES) {
      toast({ type: "error", message: "File too large. Maximum size is 10 MB." });
      return;
    }
    if (!ALLOWED_MIME.has(f.type)) {
      toast({ type: "error", message: "Invalid file type. Only PDF, JPG, and PNG are accepted." });
      return;
    }
    setFile(f);
  }

  async function handleStep1Continue() {
    if (!step1Valid || savingOrg) return;
    setSavingOrg(true);
    try {
      await apiFetch("/api/employer/company/setup", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          companyName: legalName.trim(),
          companyType,
          industry,
          companySize,
          location: location.trim(),
          ...(website.trim()      ? { companyWebsite: website.trim()      } : {}),
          ...(contactEmail.trim() ? { contactEmail:   contactEmail.trim() } : {}),
        }),
      });
      clearDraft();
      setStep(2);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 409) {
        clearDraft();
        setStep(2);
      } else {
        toast({ type: "error", message: err.message || "Failed to save organization details" });
      }
    } finally { setSavingOrg(false); }
  }

  async function handleSubmitDoc() {
    if (!step2Valid || submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file as File);
      fd.append("documentType", docType);
      await apiFetch("/api/employer/kyc/submit", {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      setStep(3);
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Network error. Please try again." });
    } finally { setSubmitting(false); }
  }

  if (checkingStatus) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-slate-500">Checking verification status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">

      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">Cykruit</span>
          <span className="text-xs font-mono text-slate-400 ml-1">/ Employer Verification</span>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

          {step < 3 && (
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900">Set up your organisation</h1>
              <p className="text-sm text-slate-500 mt-1">Complete KYC to start posting jobs and managing your team</p>
            </div>
          )}

          {/* Step progress */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
            <div className="flex items-center">
              {STEPS.map(({ n, label, icon: Icon }, i) => {
                const done = step > n; const current = step === n;
                return (
                  <div key={n} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-2 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                        done    ? "bg-blue-600 border-blue-600 text-white" :
                        current ? "bg-white border-blue-500 text-blue-600 shadow-sm ring-4 ring-blue-100" :
                                  "bg-slate-50 border-slate-200 text-slate-300"
                      }`}>
                        {done ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Icon className="w-4.5 h-4.5" />}
                      </div>
                      <span className={`text-[11px] font-medium whitespace-nowrap ${
                        current ? "text-blue-700" : done ? "text-slate-700" : "text-slate-400"
                      }`}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full transition-all ${done ? "bg-blue-500" : "bg-slate-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Organization Details</h2>
                  <p className="text-xs text-slate-400 mt-0.5">This creates your company profile on Cykruit</p>
                </div>
              </div>

              <div className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Legal Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input value={legalName} onChange={(e) => { setLegalName(e.target.value); saveDraft({ legalName: e.target.value }); }}
                    placeholder="e.g. CyberShield Technologies Pvt. Ltd." className={inputCls} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Headquarters <span className="text-rose-400">*</span>
                    </label>
                    <input value={location} onChange={(e) => { setLocation(e.target.value); saveDraft({ location: e.target.value }); }}
                      placeholder="e.g. Mumbai, India" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Company Type <span className="text-rose-400">*</span>
                    </label>
                    <select value={companyType} onChange={(e) => { setCompanyType(e.target.value); saveDraft({ companyType: e.target.value }); }} className={selectCls}>
                      <option value="">Select type</option>
                      {COMPANY_TYPES.map((t) => <option key={t.key} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Industry <span className="text-rose-400">*</span>
                    </label>
                    <select value={industry} onChange={(e) => { setIndustry(e.target.value); saveDraft({ industry: e.target.value }); }} className={selectCls}>
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Company Size <span className="text-rose-400">*</span>
                    </label>
                    <select value={companySize} onChange={(e) => { setCompanySize(e.target.value); saveDraft({ companySize: e.target.value }); }} className={selectCls}>
                      <option value="">Select size</option>
                      {COMPANY_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Company Website
                    </label>
                    <input type="url" value={website} onChange={(e) => { setWebsite(e.target.value); saveDraft({ website: e.target.value }); }}
                      placeholder="https://yourcompany.com" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Official Contact Email
                    </label>
                    <input type="email" value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); saveDraft({ contactEmail: e.target.value }); }}
                      placeholder="hr@yourcompany.com" className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <button onClick={handleStep1Continue} disabled={!step1Valid || savingOrg}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20">
                  {savingOrg ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Continue <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">KYC Document</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Upload one official document to verify your organisation</p>
                </div>
              </div>

              <div className="px-6 py-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Document Type <span className="text-rose-400">*</span>
                  </label>
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className={selectCls}>
                    <option value="">Select document type</option>
                    {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Upload Document <span className="text-rose-400">*</span>
                  </label>
                  {file ? (
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-green-50 border border-green-200 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-800 truncate">{file.name}</p>
                        <p className="text-[11px] text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={() => setFile(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-green-500 hover:text-green-700 hover:bg-green-100 transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) validateAndSetFile(f); }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      className={`flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                        <Upload className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700">Drop file here or <span className="text-blue-600">browse</span></p>
                        <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG · Max 10 MB</p>
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f); }} />
                </div>

                <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Documents reviewed within <span className="font-semibold">1–2 business days</span>. All documents are encrypted and stored securely.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSubmitDoc} disabled={!step2Valid || submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Submit for Review <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-12 flex flex-col items-center text-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Verification Submitted</h2>
                  <p className="text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                    Your documents are under review. We'll notify you within{" "}
                    <span className="font-semibold text-slate-700">1–2 business days</span>.
                  </p>
                </div>
                <a href="/employer/dashboard"
                  className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20">
                  Go to Dashboard
                </a>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  You can access the dashboard in limited mode while verification is pending. Job posting unlocks once approved.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
