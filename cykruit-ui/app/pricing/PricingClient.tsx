"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield, Check, ArrowRight, Zap, Star, HelpCircle, ChevronDown, ChevronUp,
  Users, Briefcase, Brain, Sparkles,
} from "lucide-react";

export interface PricingPackage {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  maxActiveJobs: number;
  maxTeamMembers: number;
  featuredJobSlots: number;
  aiScoringEnabled: boolean;
  priceMonthly?: string | number | null;
  priceYearly?: string | number | null;
}

const FAQS = [
  {
    q: "Can I change plans at any time?",
    a: "Yes. Upgrade or downgrade any time from your employer dashboard. Upgrades are prorated and take effect immediately. Downgrades apply at the next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "The Growth plan includes a 14-day free trial — no credit card required. Enterprise plans can be evaluated via a demo call with our team.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex), as well as bank transfers for annual Enterprise contracts.",
  },
  {
    q: "What happens when I hit my job listing limit?",
    a: "You'll be notified at 80% of your limit. To post more listings close existing ones or upgrade your plan.",
  },
  {
    q: "Do you offer discounts for non-profits or startups?",
    a: "Yes — 30% discount for verified non-profits and early-stage startups (under 2 years, under $2M funding). Contact sales to apply.",
  },
  {
    q: "How is billing handled for annual plans?",
    a: "Annual plans are billed upfront for 12 months and save ~20% vs monthly billing. An invoice is sent to your billing email on the charge date.",
  },
];

const PLAN_ACCENTS: Record<string, { border: string; ring: string; badge: string; btn: string; check: string; top: string; icon: React.ElementType }> = {
  Free:       { border: "border-slate-200",   ring: "ring-slate-200/60",   badge: "bg-slate-100 text-slate-600 border-slate-200",     btn: "bg-slate-700 hover:bg-slate-800 shadow-slate-500/20",    check: "text-slate-500",  top: "via-slate-400/40",   icon: Shield },
  Starter:    { border: "border-blue-200",    ring: "ring-blue-200/60",    badge: "bg-blue-100 text-blue-700 border-blue-200",         btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",       check: "text-blue-500",   top: "via-blue-500/50",    icon: Briefcase },
  Growth:     { border: "border-violet-300",  ring: "ring-violet-200/60",  badge: "bg-violet-100 text-violet-700 border-violet-200",   btn: "bg-violet-600 hover:bg-violet-700 shadow-violet-500/20", check: "text-violet-500", top: "via-violet-500/60",  icon: Zap },
  Enterprise: { border: "border-amber-300",   ring: "ring-amber-200/60",   badge: "bg-amber-100 text-amber-700 border-amber-200",      btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20",    check: "text-amber-500",  top: "via-amber-500/60",   icon: Brain },
};

const POPULAR_PLAN = "Growth";

function buildFeatures(pkg: PricingPackage): string[] {
  const f: string[] = [];
  if (pkg.maxActiveJobs >= 200) f.push("Unlimited active job listings");
  else f.push(`${pkg.maxActiveJobs} active job listing${pkg.maxActiveJobs !== 1 ? "s" : ""}`);
  if (pkg.maxTeamMembers >= 100) f.push("Unlimited team seats");
  else f.push(`${pkg.maxTeamMembers} team seat${pkg.maxTeamMembers !== 1 ? "s" : ""}`);
  if (pkg.aiScoringEnabled) f.push("AI candidate scoring & ranking");
  if (pkg.featuredJobSlots > 0) f.push(`${pkg.featuredJobSlots} featured job slot${pkg.featuredJobSlots !== 1 ? "s" : ""}`);
  f.push("Company profile page");
  f.push("Applicant tracking");
  if (pkg.aiScoringEnabled) f.push("Priority search placement");
  if (pkg.aiScoringEnabled) f.push("Analytics dashboard");
  if (pkg.aiScoringEnabled) f.push("Bulk messaging");
  f.push(pkg.aiScoringEnabled ? "Priority email & chat support" : "Email support");
  return f;
}

function formatPrice(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function PlanCard({ pkg, yearly }: { pkg: PricingPackage; yearly: boolean }) {
  const accent = PLAN_ACCENTS[pkg.name] ?? PLAN_ACCENTS.Starter;
  const Icon = accent.icon;
  const isPopular = pkg.name === POPULAR_PLAN;
  const monthly = formatPrice(pkg.priceMonthly);
  const annual = formatPrice(pkg.priceYearly);
  const isFree = monthly === null && annual === null;
  const displayPrice = isFree ? 0 : yearly ? (annual ?? monthly ?? 0) : (monthly ?? 0);
  const annualSaving = monthly !== null && annual !== null ? Math.round((monthly - annual) * 12) : 0;
  const features = buildFeatures(pkg);
  const cta = isFree ? "Get Started Free" : isPopular ? "Start Free Trial" : "Get Started";

  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${isPopular ? `${accent.border} ring-2 ${accent.ring} shadow-lg` : "border-slate-200 shadow-md"}`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent ${accent.top} to-transparent`} />

      {isPopular && (
        <div className="absolute top-4 right-4">
          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${accent.badge}`}>
            Most Popular
          </span>
        </div>
      )}

      {/* ── Header: icon + name + description (fixed height so all cards align) */}
      <div className="px-7 pt-7 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${accent.check}`} />
          <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed min-h-10">
          {pkg.description ?? ""}
        </p>
      </div>

      {/* ── Price block */}
      <div className="px-7 pt-4 pb-0">
        <div className="flex items-end gap-1.5 mb-1">
          <span className="text-3xl font-bold text-slate-900">
            {isFree ? "Free" : `₹${displayPrice.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          </span>
          {!isFree && <span className="text-sm text-slate-400 mb-1">/mo</span>}
        </div>
        {/* Fixed-height row so save text / empty space never shifts CTA */}
        <div className="h-5 mb-4">
          {!isFree && yearly && annualSaving > 0 && (
            <p className="text-[10px] font-mono text-emerald-600">
              ✓ Save ₹{annualSaving.toLocaleString("en-IN")}/yr with annual billing
            </p>
          )}
        </div>
      </div>

      {/* ── CTA — always flush after price, same position on every card */}
      <div className="px-7 pb-6">
        <Link
          href={`/employer/subscription/checkout?plan=${pkg.id}&billing=${yearly ? "yearly" : "monthly"}`}
          className={`w-full flex items-center justify-center gap-2 h-11 rounded-xl text-white text-sm font-semibold transition-all shadow-md ${accent.btn}`}
        >
          {cta} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Features — fills remaining height */}
      <div className="px-7 pb-7 flex-1 border-t border-slate-100 pt-5">
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3">What&apos;s included</p>
        <ul className="space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
              <Check className={`w-4 h-4 shrink-0 mt-0.5 ${accent.check}`} />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="text-sm font-semibold text-slate-800 pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function PricingClient({ packages }: { packages: PricingPackage[] }) {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Shield className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">Cykruit</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Sign in</Link>
          <Link href="/register/employer" className="h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-[10px] font-mono tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            EMPLOYER PLANS
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Hire verified cyber talent.<br className="hidden sm:block" /> Pick a plan that fits.
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto mb-8">
            Transparent pricing. No hidden fees. Upgrade or cancel anytime.
            Job seekers always use Cykruit for free.
          </p>

          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${!yearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${yearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Annual
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {packages.length === 0 ? (
          <p className="text-center text-slate-400 font-mono text-sm py-16">
            Plans temporarily unavailable — check back soon.
          </p>
        ) : (
          <div className={`grid gap-6 ${packages.length <= 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" : packages.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"}`}>
            {packages.map((pkg) => <PlanCard key={pkg.id} pkg={pkg} yearly={yearly} />)}
          </div>
        )}
        <p className="text-center text-xs text-slate-400 mt-8 font-mono">
          All plans include SSL encryption, GDPR compliance, 99.9% uptime SLA, and data portability.
        </p>
      </div>

      {/* Testimonial */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="flex items-center justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
        </div>
        <blockquote className="text-lg font-medium text-slate-700 mb-4 leading-relaxed">
          &ldquo;We filled 3 senior threat analyst roles in under 2 weeks. The AI scoring saved our hiring team dozens of hours. Growth plan pays for itself in a single hire.&rdquo;
        </blockquote>
        <p className="text-sm text-slate-400">— Head of Talent, Series B cybersecurity startup</p>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-2 mb-8">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </div>

      {/* CTA banner */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Still not sure which plan is right for you?</h2>
          <p className="text-slate-400 text-sm mb-8">Talk to our team — we&apos;ll help you pick the right fit and can arrange a custom demo.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register/employer" className="h-11 px-6 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors flex items-center gap-2">
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="h-11 px-6 rounded-xl border border-slate-600 text-slate-300 text-sm font-semibold hover:border-slate-400 hover:text-white transition-colors flex items-center gap-2">
              Talk to sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
