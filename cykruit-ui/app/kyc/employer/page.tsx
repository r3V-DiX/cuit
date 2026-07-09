"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Building2, FileText, CheckCircle2, ChevronRight,
  Upload, X, Shield, AlertCircle, ArrowRight, ChevronLeft, LogOut, Loader2,
} from "lucide-react";
import { useModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { apiFetch, authHeaders, getCsrf } from "@/lib/api";

type Step = 1 | 2 | 3;

const COMPANY_TYPES = [
  "Private Limited",
  "Public Limited",
  "Partnership",
  "Sole Proprietorship",
  "Government / PSU",
  "Non-Profit / NGO",
  "LLP",
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
  const [step, setStep] = useState<Step>(1);
  const router = useRouter();
  const { openModal } = useModal();
  const { toast } = useToast();

  function handleLogout() {
    openModal({
      variant: "danger",
      title: "Sign out?",
      description: "You'll need to sign back in to continue verification.",
      confirmLabel: "Sign out",
      onConfirm: async () => {
        try {
          await apiFetch("/api/auth/logout", {
            method: "POST",
            headers: authHeaders(),
          });
          localStorage.removeItem("cykruit_applications");
          localStorage.removeItem("cykruit_saved_jobs");
          localStorage.removeItem("cykruit_messages");
          localStorage.removeItem("cykruit_notifications");
          localStorage.removeItem("cykruit_employer_notifications");
          toast({ type: "success", message: "Logged out successfully" });
          router.push("/login");
        } catch (error) {
          toast({ type: "error", message: "Logout request failed" });
        }
      },
    });
  }

  // Step 1
  const [legalName,   setLegalName]   = useState("");
  const [location,    setLocation]    = useState("");
  const [companyType, setCompanyType] = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");

  // Step 2
  const [docType,     setDocType]     = useState("");
  const [file,        setFile]        = useState<File | null>(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const step1Valid = legalName.trim() && location.trim() && companyType && email.trim() && phone.trim();
  const step2Valid = docType && file;

  function handleFile(f: File) { setFile(f); }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">

      {/* Top bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">Cykruit</span>
          <span className="text-xs font-mono text-slate-400 ml-1">/ Employer Verification</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

          {/* Heading */}
          {step < 3 && (
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900">Verify your organisation</h1>
              <p className="text-sm text-slate-500 mt-1">Complete KYC before accessing the employer dashboard</p>
            </div>
          )}

          {/* Step progress */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
            <div className="flex items-center">
              {STEPS.map(({ n, label, icon: Icon }, i) => {
                const done    = step > n;
                const current = step === n;
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
                      }`}>
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full transition-all ${done ? "bg-blue-500" : "bg-slate-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Step 1: Organization Details ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Organization Details</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Enter your company's legal information</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Legal Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input value={legalName} onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. CyberShield Technologies Pvt. Ltd." className={inputCls} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Location <span className="text-rose-400">*</span>
                    </label>
                    <input value={location} onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Company Type <span className="text-rose-400">*</span>
                    </label>
                    <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className={selectCls}>
                      <option value="">Select type</option>
                      {COMPANY_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Official Email <span className="text-rose-400">*</span>
                    </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. hr@yourcompany.com" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 415 000 0000" className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <button onClick={() => step1Valid && setStep(2)} disabled={!step1Valid}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: KYC Document ── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4.5 h-4.5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">KYC Document</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Upload one official document to verify your organisation</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 space-y-5">
                {/* Org summary */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{legalName}</p>
                    <p className="text-[11px] text-slate-400">{companyType} · {location}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs text-blue-500 hover:text-blue-700 shrink-0 ml-auto font-medium">
                    Edit
                  </button>
                </div>

                {/* Document type */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Document Type <span className="text-rose-400">*</span>
                  </label>
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className={selectCls}>
                    <option value="">Select document type</option>
                    {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>

                {/* Upload zone */}
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
                      <button onClick={() => setFile(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-green-500 hover:text-green-700 hover:bg-green-100 transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDrop={handleDrop}
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
                        <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG · Max 5 MB</p>
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>

                {/* Notice */}
                <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Documents are reviewed within <span className="font-semibold">1–2 business days</span>. You'll receive a notification once your account is verified. All documents are encrypted and stored securely.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={async () => {
                    if (!step2Valid || submitting) return;
                    setSubmitting(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", file as File);
                      await apiFetch("/api/employer/kyc/submit", {
                        method: "POST",
                        headers: { "x-csrf-token": getCsrf() },
                        body: formData,
                      });
                      setStep(3);
                    } catch {
                      toast({ type: "error", message: "Network error. Please try again." });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={!step2Valid || submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20">
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    <>Submit for Review <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Submitted ── */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-12 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Verification Submitted</h2>
                  <p className="text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                    Your documents are under review. We'll notify you within <span className="font-semibold text-slate-700">1–2 business days</span> once verification is complete.
                  </p>
                </div>
                <a
                  href="/employer/dashboard"
                  className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
                >
                  Go to Dashboard
                </a>

                <div className="w-full max-w-sm bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-100 text-left mt-2">
                  {[
                    { label: "Legal name", value: legalName },
                    { label: "Location",   value: location  },
                    { label: "Email",      value: email     },
                    { label: "Phone",      value: phone     },
                    { label: "Document",   value: docType   },
                  ].map(({ label, value }) => (
                    <div key={label} className="px-4 py-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">{label}</span>
                      <span className="text-xs font-semibold text-slate-700 truncate ml-2">{value}</span>
                    </div>
                  ))}
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">Status</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Under Review
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
