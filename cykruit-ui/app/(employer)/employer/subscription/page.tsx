"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import { apiFetch, authHeaders } from "@/lib/api";
import { useKycContext } from "@/lib/employer-context";
import {
  CreditCard, Check, Zap, Building2, Shield, ShieldAlert, Clock,
  AlertTriangle, Download, ExternalLink, ChevronRight, Star,
  TrendingUp, Users, Briefcase, RefreshCw, XCircle, Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubPackage {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  maxActiveJobs: number;
  maxTeamMembers: number;
  featuredJobSlots: number;
  aiScoringEnabled: boolean;
  priceMonthly?: string | null;
  priceYearly?: string | null;
}

interface MySubscription {
  hasSubscription: boolean;
  effectiveStatus?: string;
  cancelAtPeriodEnd?: boolean;
  id?: string;
  packageId?: string;
  billingCycle?: string;
  expiresAt?: string;
  startedAt?: string;
  package?: SubPackage;
}

interface MyUsage {
  hasSubscription: boolean;
  effectiveStatus?: string;
  expiresAt?: string;
  packageName?: string;
  limits?: {
    maxActiveJobs: number;
    maxTeamMembers: number;
    featuredJobSlots: number;
    aiScoringEnabled: boolean;
  };
  usage?: {
    currentActiveJobs: number;
    currentTeamMembers: number;
    usedFeaturedJobSlots: number;
  };
}

interface PaymentOrder {
  id: string;
  razorpayOrderId: string;
  billingCycle: string;
  amountPaise: number;
  discountAmountPaise: number;
  couponCode?: string | null;
  gstAmountPaise: number;
  totalAmountPaise: number;
  currency: string;
  status: "CREATED" | "PAID" | "FAILED" | "EXPIRED";
  createdAt: string;
  package?: { id: string; name: string };
  payment?: { razorpayPaymentId: string; capturedAt?: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: "Active",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  EXPIRED:   { label: "Expired",   cls: "bg-amber-100 text-amber-700 border-amber-200"       },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500 border-slate-200"       },
};

const ORDER_STATUS_CLS: Record<string, string> = {
  PAID:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  CREATED: "bg-blue-50 text-blue-700 border-blue-200",
  FAILED:  "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-slate-100 text-slate-400 border-slate-200",
};

function paise(n: number) {
  return "₹" + (n / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 });
}

function priceLabel(pkg: SubPackage | undefined, billing: string): string {
  if (!pkg) return "—";
  const raw = billing === "YEARLY" ? pkg.priceYearly : pkg.priceMonthly;
  if (!raw) return "Free";
  return "₹" + Number(raw).toLocaleString("en-IN") + (billing === "YEARLY" ? "/yr" : "/mo");
}

function UsageBar({ used, limit, color }: { used: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const warn = pct >= 80;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5" aria-label={`${used} of ${limit} used, ${Math.round(pct)}%`}>
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
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "plans" ? "plans" : "overview";
  const [tab, setTab] = useState<"overview" | "plans" | "history">(initialTab);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const [sub, setSub] = useState<MySubscription | null>(null);
  const [usage, setUsage] = useState<MyUsage | null>(null);
  const [packages, setPackages] = useState<SubPackage[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);
  const { status: kycStatusRaw, employerRole } = useKycContext();
  const kycStatus = kycStatusRaw;
  const isKycVerified = kycStatus === "verified";

  useEffect(() => {
    async function load() {
      setLoadError(false);
      try {
        const [subRes, usageRes, pkgRes, ordersRes] = await Promise.all([
          apiFetch<MySubscription>("/api/subscriptions/my").catch(() => null),
          apiFetch<MyUsage>("/api/subscriptions/usage").catch(() => null),
          apiFetch<SubPackage[]>("/api/subscriptions/packages").catch(() => null),
          apiFetch<PaymentOrder[]>("/api/subscriptions/orders").catch(() => null),
        ]);
        if (subRes?.data) setSub(subRes.data);
        if (usageRes?.data) setUsage(usageRes.data);
        if (pkgRes?.data) {
          const arr = Array.isArray(pkgRes.data) ? pkgRes.data : [];
          setPackages(arr.filter((p) => p.priceMonthly != null || p.priceYearly != null));
        }
        if (ordersRes?.data) {
          const arr = Array.isArray(ordersRes.data) ? ordersRes.data : [];
          setOrders(arr);
        }
        if (!subRes && !usageRes && !pkgRes) setLoadError(true);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const planStatus = sub?.effectiveStatus ?? usage?.effectiveStatus ?? "";
  const sc = STATUS_CONFIG[planStatus] ?? STATUS_CONFIG.ACTIVE;
  const planName = sub?.package?.name ?? usage?.packageName ?? "No active plan";
  const planBilling = sub?.billingCycle ?? "MONTHLY";
  const planRenewsAt = sub?.expiresAt ? sub.expiresAt.slice(0, 10) : "—";
  const planPackageId = sub?.packageId ?? "";

  const jobsUsed = usage?.usage?.currentActiveJobs ?? 0;
  const jobsLimit = usage?.limits?.maxActiveJobs ?? 0;
  const teamUsed = usage?.usage?.currentTeamMembers ?? 0;
  const teamLimit = usage?.limits?.maxTeamMembers ?? 0;

  const hasActiveSub = sub?.hasSubscription && planStatus === "ACTIVE";
  const isFreePlan = !sub?.package?.priceMonthly && !sub?.package?.priceYearly;

  function handleCancelPlan() {
    openModal({
      variant: "danger",
      title: "Cancel subscription?",
      description: `Your ${planName} plan will remain active until ${planRenewsAt}. After that you'll be moved to the free tier.`,
      confirmLabel: "Yes, cancel plan",
      onConfirm: async () => {
        setCancelling(true);
        try {
          await apiFetch("/api/subscriptions/cancel", {
            method: "POST",
            headers: authHeaders(),
          });
          toast({ type: "success", message: "Subscription cancelled", description: `Access continues until ${planRenewsAt}.` });
          setSub((prev) => prev ? { ...prev, effectiveStatus: "CANCELLED", cancelAtPeriodEnd: true } : prev);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to cancel subscription";
          toast({ type: "error", message: msg });
        } finally {
          setCancelling(false);
        }
      },
    });
  }

  function handleResumePlan() {
    openModal({
      variant: "default",
      title: "Resume subscription?",
      description: `Your ${planName} plan will stay active beyond ${planRenewsAt} and renew normally.`,
      confirmLabel: "Yes, resume plan",
      onConfirm: async () => {
        setResuming(true);
        try {
          await apiFetch("/api/subscriptions/resume", {
            method: "POST",
            headers: authHeaders(),
          });
          toast({ type: "success", message: "Subscription resumed", description: "Your plan is active again." });
          setSub((prev) => prev ? { ...prev, effectiveStatus: "ACTIVE", cancelAtPeriodEnd: false } : prev);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to resume subscription";
          toast({ type: "error", message: msg });
        } finally {
          setResuming(false);
        }
      },
    });
  }

  const TABS = [
    { id: "overview", label: "Overview"      },
    { id: "plans",    label: "Change Plan"    },
    { id: "history",  label: "Billing History"},
  ] as const;

  if (employerRole !== null && employerRole !== "OWNER") {
    return (
      <>
        <EmployerTopbar title="Subscription" />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-sm text-slate-500">Only the company Owner can manage billing and subscription.</p>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <EmployerTopbar title="Subscription" />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </main>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <EmployerTopbar title="Subscription" />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Failed to load subscription data</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Check your connection and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors mx-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <EmployerTopbar title="Subscription" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">

        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Subscription & Billing</h2>
            <p className="text-sm text-slate-400 mt-0.5">Manage your plan and payment history.</p>
          </div>
          <Link
            href="/pricing"
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View pricing <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-5">

          {/* Tabs — full-width horizontal bar. Each tab grows to fill the width
              evenly; on narrow screens they wrap before the labels ever clip. */}
          <div className="w-full bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap gap-1">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border cursor-pointer ${
                  tab === id ? "bg-blue-50 text-blue-700 border-blue-100" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-w-0 space-y-4">

            {/* ══ OVERVIEW ══ */}
            {tab === "overview" && (
              <>
                {planStatus === "EXPIRED" && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Subscription expired</p>
                      <p className="text-xs text-amber-600 mt-0.5">Your plan expired on {planRenewsAt}. Upgrade to restore full access.</p>
                      <button onClick={() => setTab("plans")} className="text-xs font-semibold text-amber-700 underline mt-1">Upgrade now →</button>
                    </div>
                  </div>
                )}

                {!sub?.hasSubscription && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <h3 className="text-base font-bold text-slate-900">Free Plan</h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border bg-slate-100 text-slate-500 border-slate-200">Current</span>
                          </div>
                          <p className="text-sm text-slate-400">Basic access — no payment required</p>
                        </div>
                        <span className="text-2xl font-bold text-slate-900 shrink-0">₹0<span className="text-sm font-normal text-slate-400">/mo</span></span>
                      </div>
                    </div>

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
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Team Members</p>
                        </div>
                        <UsageBar used={teamUsed} limit={teamLimit} color="bg-blue-500" />
                      </div>
                    </div>

                    {usage?.limits && (
                      <div className="px-6 pb-5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">What&apos;s included</p>
                        <ul className="space-y-1.5">
                          {[
                            `${usage.limits.maxActiveJobs} active job listings`,
                            `${usage.limits.maxTeamMembers} team member${usage.limits.maxTeamMembers !== 1 ? "s" : ""}`,
                            usage.limits.featuredJobSlots > 0 ? `${usage.limits.featuredJobSlots} featured slot${usage.limits.featuredJobSlots !== 1 ? "s" : ""}` : null,
                            usage.limits.aiScoringEnabled ? "AI candidate scoring" : null,
                          ].filter(Boolean).map((f) => (
                            <li key={f as string} className="flex items-center gap-2 text-xs text-slate-600">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs text-slate-400">Upgrade to unlock more listings, team slots, and AI screening.</p>
                      <button
                        onClick={() => setTab("plans")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> View Plans
                      </button>
                    </div>
                  </div>
                )}

                {sub?.hasSubscription && (
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
                            {priceLabel(sub.package, planBilling)} · {planBilling === "YEARLY" ? "billed annually" : "billed monthly"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-0.5">
                            {planStatus === "CANCELLED" ? "Expires" : "Renews"}
                          </p>
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 justify-end">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {planRenewsAt}
                          </p>
                        </div>
                      </div>
                    </div>

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
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Team Members</p>
                        </div>
                        <UsageBar used={teamUsed} limit={teamLimit} color="bg-blue-500" />
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3">
                      <button
                        onClick={() => setTab("plans")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Change Plan
                      </button>
                      <button
                        onClick={() => setTab("history")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Billing History
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Active Listings",  value: jobsUsed,                          icon: Briefcase, color: "text-violet-600" },
                    { label: "Team Members",      value: teamUsed,                          icon: Users,     color: "text-blue-600"   },
                    { label: "Jobs Remaining",    value: Math.max(0, jobsLimit - jobsUsed), icon: Clock,     color: "text-slate-500"  },
                    { label: "Payments Made",     value: orders.filter(o => o.status === "PAID").length, icon: CreditCard, color: "text-emerald-600" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <Icon className={`w-4 h-4 mb-2 ${color}`} />
                      <p className="text-xl font-bold text-slate-900">{value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {hasActiveSub && !isFreePlan && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Cancel subscription</p>
                        <p className="text-xs text-slate-400 mt-0.5">You&apos;ll retain access until {planRenewsAt}.</p>
                      </div>
                      <button
                        onClick={handleCancelPlan}
                        disabled={cancelling}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        {cancelling ? "Cancelling…" : "Cancel Plan"}
                      </button>
                    </div>
                  </div>
                )}

                {sub?.hasSubscription && sub?.cancelAtPeriodEnd === true && planStatus === "CANCELLED" && !isFreePlan && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Resume subscription</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          You cancelled your {planName} plan. It stays active until {planRenewsAt} — resume to keep it running past that date.
                        </p>
                      </div>
                      <button
                        onClick={handleResumePlan}
                        disabled={resuming}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        {resuming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        {resuming ? "Resuming…" : "Resume Plan"}
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
                    <p className="text-xs text-slate-400 mt-0.5">
                      Currently on <span className="font-semibold text-slate-600">{planName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button onClick={() => setBillingCycle("monthly")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Monthly</button>
                    <button onClick={() => setBillingCycle("yearly")}  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${billingCycle === "yearly"  ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                      Annual <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-100 text-emerald-700">-20%</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {packages.map((pkg) => {
                    const isCurrent = pkg.id === planPackageId || pkg.name === planName;
                    const price = billingCycle === "yearly"
                      ? (pkg.priceYearly ? Number(pkg.priceYearly) : null)
                      : (pkg.priceMonthly ? Number(pkg.priceMonthly) : null);
                    const isEnterprise = pkg.name.toLowerCase() === "enterprise";
                    const Icon = pkg.name.toLowerCase() === "growth" ? Zap : pkg.name.toLowerCase() === "enterprise" ? Building2 : Shield;
                    const accentBtn = pkg.name.toLowerCase() === "growth" ? "bg-violet-600 hover:bg-violet-700" : "bg-blue-600 hover:bg-blue-700";
                    const currentPrice = packages.find(p => p.id === planPackageId || p.name === planName);
                    const currentPriceVal = currentPrice?.priceMonthly ? Number(currentPrice.priceMonthly) : 0;
                    const annualSaving = pkg.priceMonthly && pkg.priceYearly
                      ? Math.round(Number(pkg.priceMonthly) * 12 - Number(pkg.priceYearly))
                      : 0;

                    return (
                      <div key={pkg.id} className={`relative rounded-2xl border flex flex-col ${isCurrent ? "border-blue-200 ring-2 ring-blue-200/50" : "border-slate-200"}`}>
                        {isCurrent && (
                          <span className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-blue-700">Current</span>
                        )}

                        {/* Name + description — fixed min-height so all cards align */}
                        <div className="px-5 pt-5 pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-bold text-slate-900">{pkg.name}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed min-h-8">
                            {pkg.description ?? ""}
                          </p>
                        </div>

                        {/* Price — fixed-height save row keeps CTA pinned */}
                        <div className="px-5 pt-3 pb-0">
                          <div className="flex items-end gap-1 mb-1">
                            <span className="text-2xl font-bold text-slate-900">
                              {isEnterprise ? "Custom" : price != null ? `₹${price.toLocaleString("en-IN")}` : "Free"}
                            </span>
                            {!isEnterprise && price != null && <span className="text-xs text-slate-400 mb-1">{billingCycle === "yearly" ? "/yr" : "/mo"}</span>}
                          </div>
                          <div className="h-4 mb-4">
                            {billingCycle === "yearly" && annualSaving > 0 && (
                              <p className="text-[10px] font-mono text-emerald-600">✓ Save ₹{annualSaving.toLocaleString("en-IN")}/yr</p>
                            )}
                          </div>
                        </div>

                        {/* CTA — always same vertical position */}
                        <div className="px-5 pb-5">
                          {isCurrent ? (
                            <button disabled className="w-full h-10 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> Current Plan
                            </button>
                          ) : isKycVerified ? (
                            <Link
                              href={isEnterprise ? "/contact" : `/employer/subscription/checkout?packageId=${pkg.id}&billing=${billingCycle.toUpperCase()}`}
                              className={`w-full h-10 rounded-xl text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${accentBtn}`}
                            >
                              {isEnterprise ? "Contact Sales" : price != null && Number(currentPriceVal) > 0 && price > currentPriceVal ? "Upgrade" : "Select Plan"}
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <Link
                              href="/kyc/employer"
                              className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                            >
                              Complete KYC to purchase <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>

                        {/* Features — fills rest of card */}
                        <div className="px-5 pb-5 pt-4 border-t border-slate-100 flex-1">
                          <ul className="space-y-1.5">
                            {[
                              `${pkg.maxActiveJobs} active job listings`,
                              `${pkg.maxTeamMembers} team members`,
                              pkg.featuredJobSlots > 0 ? `${pkg.featuredJobSlots} featured slots` : null,
                              pkg.aiScoringEnabled ? "AI candidate scoring" : null,
                            ].filter(Boolean).map((f) => (
                              <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                  {packages.length === 0 && (
                    <div className="col-span-3 py-8 text-center text-sm text-slate-400">No packages available.</div>
                  )}
                </div>
              </div>
            )}

            {/* ══ BILLING HISTORY ══ */}
            {tab === "history" && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Billing History</h3>
                    <p className="text-xs text-slate-400 mt-0.5">All Razorpay payment orders for your account.</p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <CreditCard className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No payment orders yet.</p>
                    <p className="text-xs text-slate-300 mt-1">Orders will appear here once you subscribe to a paid plan.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {["Package", "Cycle", "Base", "Discount", "GST", "Total", "Status", "Date"].map((h) => (
                            <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {orders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3.5 text-slate-700 font-medium">{o.package?.name ?? "—"}</td>
                            <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{o.billingCycle}</td>
                            <td className="px-6 py-3.5 font-mono text-xs text-slate-600">{paise(o.amountPaise)}</td>
                            <td className="px-6 py-3.5 font-mono text-xs text-emerald-600">
                              {o.discountAmountPaise > 0 ? (
                                <span title={o.couponCode ?? undefined}>
                                  -{paise(o.discountAmountPaise)}
                                  {o.couponCode && <span className="ml-1 text-[9px] text-slate-400">({o.couponCode})</span>}
                                </span>
                              ) : "—"}
                            </td>
                            <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{paise(o.gstAmountPaise)}</td>
                            <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-900">{paise(o.totalAmountPaise)}</td>
                            <td className="px-6 py-3.5">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${ORDER_STATUS_CLS[o.status] ?? ORDER_STATUS_CLS.EXPIRED}`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-xs text-slate-500">
                              {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> Payments processed securely via Razorpay. All amounts in INR including 18% GST.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
