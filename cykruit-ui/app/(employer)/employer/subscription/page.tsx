"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import {
  CreditCard, Check, Zap, Building2, Shield, ArrowRight, Clock,
  AlertTriangle, Download, ExternalLink, ChevronRight, Star,
  TrendingUp, Users, Briefcase, RefreshCw, XCircle, Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface Subscription {
  id: string;
  packageId: string;
  status: "active" | "cancelled" | "past_due" | "trialing";
  startDate: string;
  endDate: string | null;
  billingCycle: "monthly" | "yearly";
  package: SubscriptionPackage;
}

interface Usage {
  jobsUsed: number;
  jobsLimit: number;
  applicantsViewedUsed: number;
  applicantsViewedLimit: number;
  [key: string]: number;
}

interface ApiPackage {
  id: string;
  name: string;
  price: number;
  features: string[];
}

// ── Static UI config (icon/color/yearlyPrice not returned by API) ─────────────
const PLAN_UI: Record<string, { yearlyPrice: number; icon: React.ElementType; color: string }> = {
  starter:    { yearlyPrice: 39,  icon: Shield,    color: "blue"    },
  growth:     { yearlyPrice: 119, icon: Zap,       color: "violet"  },
  enterprise: { yearlyPrice: 319, icon: Building2, color: "emerald" },
};

const PAYMENT_METHODS = [
  { id: "pm_1", brand: "Visa", last4: "4242", expiry: "09/27", isDefault: true },
];

const INVOICES = [
  { id: "INV-2026-006", date: "2026-06-01", amount: 149, status: "paid",   period: "Jun 2026" },
  { id: "INV-2026-005", date: "2026-05-01", amount: 149, status: "paid",   period: "May 2026" },
  { id: "INV-2026-004", date: "2026-04-01", amount: 149, status: "paid",   period: "Apr 2026" },
  { id: "INV-2026-003", date: "2026-03-01", amount: 149, status: "paid",   period: "Mar 2026" },
  { id: "INV-2026-002", date: "2026-02-01", amount: 149, status: "paid",   period: "Feb 2026" },
  { id: "INV-2026-001", date: "2026-01-01", amount: 149, status: "paid",   period: "Jan 2026" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusConfig = {
  active:    { label: "Active",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  trialing:  { label: "Trial",     cls: "bg-blue-100 text-blue-700 border-blue-200"          },
  past_due:  { label: "Past Due",  cls: "bg-amber-100 text-amber-700 border-amber-200"       },
  cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-500 border-slate-200"       },
};

function cardBrandIcon(brand: string) {
  if (brand === "Visa") return (
    <svg className="w-8 h-5" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#1A1F71"/>
      <text x="6" y="22" fill="white" fontSize="14" fontFamily="Arial" fontWeight="bold">VISA</text>
    </svg>
  );
  return <CreditCard className="w-5 h-5 text-slate-400" />;
}

function UsageBar({ used, limit, color }: { used: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const warn = pct >= 80;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500">{used} / {limit}</span>
        <span className={warn ? "text-amber-600 font-semibold" : "text-slate-400"}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${warn ? "bg-amber-400" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const { toast } = useToast();
  const { openModal } = useModal();
  const [tab, setTab] = useState<"overview" | "plans" | "payment" | "history">("overview");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [subData, usageData, pkgData] = await Promise.all([
          fetch("/api/subscriptions/my", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch("/api/subscriptions/usage", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch("/api/subscriptions/packages", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        if (subData)  setSubscription(subData);
        if (usageData) setUsage(usageData);
        if (pkgData)  setPackages(pkgData);
      } catch {
        // silently ignore; UI shows fallbacks
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const planStatus = subscription?.status ?? "active";
  const sc = statusConfig[planStatus] ?? statusConfig.active;
  const planName = subscription?.package?.name ?? "No active plan";
  const planPrice = subscription?.package?.price ?? 0;
  const planBilling = subscription?.billingCycle ?? "monthly";
  const planRenewsAt = subscription?.endDate ? subscription.endDate.slice(0, 10) : "—";
  const planPackageId = subscription?.packageId ?? "";

  const jobsUsed = usage?.jobsUsed ?? 0;
  const jobsLimit = usage?.jobsLimit ?? 0;
  const applicantsUsed = usage?.applicantsViewedUsed ?? 0;
  const applicantsLimit = usage?.applicantsViewedLimit ?? 0;

  function handleCancelPlan() {
    openModal({
      variant: "danger",
      title: "Cancel subscription?",
      description: `Your ${planName} plan will remain active until ${planRenewsAt}. After that you'll be moved to the free tier and excess job listings will be paused.`,
      confirmLabel: "Yes, cancel plan",
      onConfirm: () => {
        toast({ type: "info", message: "Subscription cancelled", description: `Access continues until ${planRenewsAt}.` });
      },
    });
  }

  function handleRemoveCard(last4: string) {
    openModal({
      variant: "danger",
      title: "Remove payment method?",
      description: `Remove card ending in ${last4}? You'll need to add a new card before your next renewal.`,
      confirmLabel: "Remove card",
      onConfirm: () => {
        toast({ type: "success", message: "Payment method removed" });
      },
    });
  }

  const TABS = [
    { id: "overview", label: "Overview"        },
    { id: "plans",    label: "Change Plan"      },
    { id: "payment",  label: "Payment Methods"  },
    { id: "history",  label: "Billing History"  },
  ] as const;

  if (loading) {
    return (
      <>
        <EmployerTopbar title="Subscription" />
        <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center min-h-100">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <EmployerTopbar title="Subscription" />
      <main className="flex-1 overflow-y-auto p-6">

        {/* Header strip */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Subscription & Billing</h2>
            <p className="text-sm text-slate-400 mt-0.5">Manage your plan, payment methods, and invoices.</p>
          </div>
          <Link
            href="/pricing"
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View pricing page <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* ── Left tab sidebar ── */}
          <div className="w-full md:w-48 md:shrink-0 bg-white rounded-2xl border border-slate-200 p-2 flex flex-row md:flex-col gap-0.5 overflow-x-auto md:sticky md:top-6">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all shrink-0 whitespace-nowrap border cursor-pointer ${
                  tab === id ? "bg-blue-50 text-blue-700 border-blue-100" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ══ OVERVIEW ══ */}
            {tab === "overview" && (
              <>
                {/* Past due alert */}
                {planStatus === "past_due" && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Payment failed</p>
                      <p className="text-xs text-amber-600 mt-0.5">Your last payment could not be processed. Please update your payment method to avoid interruption.</p>
                      <button onClick={() => setTab("payment")} className="text-xs font-semibold text-amber-700 underline mt-1">Update payment method →</button>
                    </div>
                  </div>
                )}

                {/* No subscription state */}
                {!subscription && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <p className="text-sm font-semibold text-slate-600">No active plan</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">You don&apos;t have an active subscription yet.</p>
                    <button
                      onClick={() => setTab("plans")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> View Plans
                    </button>
                  </div>
                )}

                {/* Current plan card */}
                {subscription && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <Zap className="w-4 h-4 text-violet-500" />
                            <h3 className="text-base font-bold text-slate-900">{planName} Plan</h3>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${sc.cls}`}>{sc.label}</span>
                          </div>
                          <p className="text-sm text-slate-400">
                            ${planPrice}/mo · {planBilling === "yearly" ? "billed annually" : "billed monthly"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-0.5">
                            {planStatus === "cancelled" ? "Expires" : "Renews"}
                          </p>
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 justify-end">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {planRenewsAt}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Usage */}
                    <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Job Listings</p>
                        </div>
                        <UsageBar used={jobsUsed} limit={jobsLimit} color="bg-violet-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Applicants Viewed</p>
                        </div>
                        <UsageBar used={applicantsUsed} limit={applicantsLimit} color="bg-blue-500" />
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3">
                      <button
                        onClick={() => setTab("plans")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Upgrade Plan
                      </button>
                      <button
                        onClick={() => setTab("payment")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Manage Payment
                      </button>
                      <button
                        onClick={() => setTab("history")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Invoices
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Active Listings",   value: jobsUsed,                          icon: Briefcase,  color: "text-violet-600"  },
                    { label: "Applicants Viewed",  value: applicantsUsed,                    icon: Users,      color: "text-blue-600"    },
                    { label: "Jobs Remaining",     value: Math.max(0, jobsLimit - jobsUsed), icon: Clock,      color: "text-slate-500"   },
                    { label: "Total Invoiced",     value: `$${INVOICES.reduce((s, i) => s + i.amount, 0)}`, icon: CreditCard, color: "text-emerald-600" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <Icon className={`w-4 h-4 mb-2 ${color}`} />
                      <p className="text-xl font-bold text-slate-900">{value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Cancel zone */}
                {subscription && planStatus !== "cancelled" && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Cancel subscription</p>
                        <p className="text-xs text-slate-400 mt-0.5">You&apos;ll retain access until {planRenewsAt}. This cannot be undone.</p>
                      </div>
                      <button
                        onClick={handleCancelPlan}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel Plan
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══ CHANGE PLAN ══ */}
            {tab === "plans" && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Available Plans</h3>
                    <p className="text-xs text-slate-400 mt-0.5">You&apos;re currently on <span className="font-semibold text-slate-600">{planName} ({planBilling === "yearly" ? "Annual" : "Monthly"})</span></p>
                  </div>
                  {/* Billing toggle */}
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button onClick={() => setBillingCycle("monthly")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Monthly</button>
                    <button onClick={() => setBillingCycle("yearly")}  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${billingCycle === "yearly"  ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                      Annual <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-100 text-emerald-700">-20%</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg) => {
                    const ui = PLAN_UI[pkg.id.toLowerCase()] ?? PLAN_UI[pkg.name.toLowerCase()] ?? { yearlyPrice: Math.round(pkg.price * 0.8), icon: Zap, color: "violet" };
                    const price = billingCycle === "yearly" ? ui.yearlyPrice : pkg.price;
                    const isCurrent = pkg.id === planPackageId || pkg.name === planName;
                    const Icon = ui.icon;
                    const isEnterprise = pkg.id === "enterprise" || pkg.name.toLowerCase() === "enterprise";
                    const accent =
                      ui.color === "violet"  ? { btn: "bg-violet-600 hover:bg-violet-700 shadow-violet-500/20", badge: "bg-violet-50 border-violet-200 text-violet-700", border: "border-violet-200 ring-2 ring-violet-200/50" }
                    : ui.color === "emerald" ? { btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20", badge: "bg-emerald-50 border-emerald-200 text-emerald-700", border: "border-emerald-200 ring-2 ring-emerald-200/50" }
                    : { btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20", badge: "bg-blue-50 border-blue-200 text-blue-700", border: "border-blue-200 ring-2 ring-blue-200/50" };

                    const currentPkgPrice = packages.find(x => x.id === planPackageId || x.name === planName)?.price ?? 0;

                    return (
                      <div key={pkg.id} className={`relative rounded-2xl border p-5 flex flex-col gap-4 ${isCurrent ? accent.border : "border-slate-200"}`}>
                        {isCurrent && (
                          <span className={`absolute top-3 right-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${accent.badge}`}>Current</span>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-bold text-slate-900">{pkg.name}</span>
                          </div>
                          <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-slate-900">{isEnterprise ? "Custom" : `$${price}`}</span>
                            {!isEnterprise && <span className="text-xs text-slate-400 mb-1">/mo</span>}
                          </div>
                          {billingCycle === "yearly" && !isEnterprise && (
                            <p className="text-[10px] font-mono text-emerald-600 mt-0.5">Save ${(pkg.price - ui.yearlyPrice) * 12}/yr</p>
                          )}
                        </div>

                        {isCurrent ? (
                          <button disabled className="w-full h-10 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Current Plan
                          </button>
                        ) : (
                          <Link
                            href={isEnterprise ? "/contact" : `/employer/subscription/checkout?plan=${pkg.id}&billing=${billingCycle}&from=subscription`}
                            className={`w-full h-10 rounded-xl text-white text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 ${accent.btn}`}
                          >
                            {isEnterprise ? "Contact Sales" : pkg.price > currentPkgPrice ? "Upgrade" : "Downgrade"}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                  {packages.length === 0 && (
                    <div className="col-span-3 py-8 text-center text-sm text-slate-400">No packages available.</div>
                  )}
                </div>

                <div className="px-6 pb-5 text-center">
                  <p className="text-[10px] text-slate-400 font-mono">Upgrades are prorated. Downgrades take effect next cycle.</p>
                </div>
              </div>
            )}

            {/* ══ PAYMENT METHODS ══ */}
            {tab === "payment" && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Payment Methods</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cards used for subscription billing.</p>
                  </div>
                  <Link
                    href="/employer/subscription/checkout?action=add_card"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    + Add Card
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {PAYMENT_METHODS.map((pm) => (
                    <div key={pm.id} className="px-6 py-4 flex items-center gap-4">
                      {cardBrandIcon(pm.brand)}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{pm.brand} ending in {pm.last4}</p>
                        <p className="text-xs text-slate-400">Expires {pm.expiry}</p>
                      </div>
                      {pm.isDefault && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Default</span>
                      )}
                      <button
                        onClick={() => handleRemoveCard(pm.last4)}
                        className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> Card details are encrypted and never stored on our servers. Powered by Stripe.
                  </p>
                </div>
              </div>
            )}

            {/* ══ BILLING HISTORY ══ */}
            {tab === "history" && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Billing History</h3>
                  <p className="text-xs text-slate-400 mt-0.5">All invoices for your account.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Invoice</th>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Period</th>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-3 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {INVOICES.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-xs text-slate-600">{inv.id}</td>
                          <td className="px-6 py-3.5 text-slate-700">{inv.period}</td>
                          <td className="px-6 py-3.5 text-slate-500 text-xs">{inv.date}</td>
                          <td className="px-6 py-3.5 font-semibold text-slate-800">${inv.amount}</td>
                          <td className="px-6 py-3.5">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              inv.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => toast({ type: "info", message: `Downloading ${inv.id}...` })}
                              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-400">Showing {INVOICES.length} invoices</p>
                  <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
