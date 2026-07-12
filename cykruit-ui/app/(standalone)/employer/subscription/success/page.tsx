"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield, Check, Zap, ArrowRight, Download,
  LayoutDashboard, Briefcase, Star,
} from "lucide-react";

const PLAN_NAMES: Record<string, string> = { starter: "Starter", growth: "Growth" };

const PLAN_ICONS: Record<string, React.ReactNode> = {
  starter: <Shield className="w-5 h-5 text-blue-500"   />,
  growth:  <Zap    className="w-5 h-5 text-violet-500" />,
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["5 active job listings", "Basic applicant tracking", "Company profile", "Email support"],
  growth:  ["25 active job listings", "AI candidate scoring", "3 team seats", "Analytics dashboard", "Priority support"],
};

function inr(paise: number) {
  return "₹" + Math.round(paise / 100).toLocaleString("en-IN");
}

function SuccessContent() {
  const params  = useSearchParams();
  const planId  = params.get("plan")    || "growth";
  const billing = params.get("billing") || "monthly";
  const amount  = parseInt(params.get("amount") || "0", 10);

  const planName     = PLAN_NAMES[planId]    || "Growth";
  const planFeatures = PLAN_FEATURES[planId] || [];
  const planIcon     = PLAN_ICONS[planId];

  const today    = new Date();
  const renewsOn = new Date(today);
  if (billing === "yearly") renewsOn.setFullYear(renewsOn.getFullYear() + 1);
  else renewsOn.setMonth(renewsOn.getMonth() + 1);

  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top bar */}
      <header className="relative z-10 h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Shield className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-slate-900">Cykruit</span>
        </Link>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Success icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center">
                <Check className="w-9 h-9 text-emerald-600" strokeWidth={3} />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-emerald-300/50 animate-ping" />
            </div>
          </div>

          {/* Main card */}
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden mb-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-emerald-500/60 to-transparent" />

            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-mono tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                PAYMENT SUCCESSFUL
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome to {planName}!</h1>
              <p className="text-slate-500 text-sm mb-6">
                Your subscription is now active. A receipt has been sent to your billing email.
              </p>

              {/* Plan summary */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-left">
                <div className="flex items-center gap-3">
                  {planIcon}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{planName} Plan</p>
                    <p className="text-xs text-slate-400 capitalize">{billing} billing · Renews {fmt(renewsOn)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{inr(amount)}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Charged today</p>
                </div>
              </div>

              {/* Features unlocked */}
              <div className="text-left mb-6">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3 text-center">Features Unlocked</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {planFeatures.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xs text-slate-400 mb-6">Thank you for choosing Cykruit for your hiring needs.</p>

              {/* CTA */}
              <div className="space-y-3">
                <Link href="/employer/dashboard" className="w-full h-11 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 text-white text-sm font-bold hover:from-blue-400 hover:to-blue-500 shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/employer/jobs/new" className="h-10 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Post a Job
                  </Link>
                  <Link href="/employer/subscription" className="h-10 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> View Invoice
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4">What&apos;s Next?</p>
            <div className="space-y-3">
              {[
                { step: "1", title: "Complete your company profile", desc: "Add your logo, bio, and perks to attract top talent.", href: "/employer/company" },
                { step: "2", title: "Post your first job listing",   desc: "Use our AI tools to write compelling job descriptions.", href: "/employer/jobs/new" },
                { step: "3", title: "Invite your team",              desc: "Add team members to collaborate on hiring.", href: "/employer/settings" },
              ].map(({ step, title, desc, href }) => (
                <Link key={step} href={href} className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-200 transition-colors">
                    <span className="text-[10px] font-bold text-blue-600">{step}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-mono mt-6">
            Questions? <Link href="/contact" className="text-blue-500 hover:underline">Contact support</Link> · <Link href="/employer/subscription" className="text-blue-500 hover:underline">Manage subscription</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
