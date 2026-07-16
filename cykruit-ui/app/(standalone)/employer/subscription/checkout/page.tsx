"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders } from "@/lib/api";
import {
  Shield, Lock, Check, ChevronLeft, Zap, Loader2,
  CreditCard, Smartphone, Building2,
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

interface CreateOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  breakdown: {
    baseAmountPaise: number;
    gstAmountPaise: number;
    totalAmountPaise: number;
    gstPercent: number;
  };
  packageName: string;
  billingCycle: string;
  keyId: string;
}

declare global {
  interface Window {
    Razorpay: new (opts: RazorpayOptions) => { open(): void };
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { email?: string; name?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inr(paise: number) {
  return "₹" + Math.round(paise / 100).toLocaleString("en-IN");
}

function normalizeBilling(raw: string): "MONTHLY" | "YEARLY" {
  return raw.toUpperCase() === "YEARLY" ? "YEARLY" : "MONTHLY";
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.head.appendChild(s);
  });
}

function pkgFeatures(p: SubPackage): string[] {
  const f: string[] = [
    `${p.maxActiveJobs} active job listings`,
    `${p.maxTeamMembers} team members`,
  ];
  if (p.featuredJobSlots > 0) f.push(`${p.featuredJobSlots} featured job slots`);
  if (p.aiScoringEnabled) f.push("AI candidate scoring");
  return f;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function CheckoutContent() {
  const params    = useSearchParams();
  const router    = useRouter();
  const { toast } = useToast();

  // Support both ?packageId=xxx&billing=MONTHLY (new) and ?plan=growth&billing=monthly (legacy)
  const packageIdParam = params.get("packageId") ?? "";
  const planParam      = params.get("plan") ?? "growth";
  const billingParam   = normalizeBilling(params.get("billing") ?? "monthly");

  const [pkg, setPkg]       = useState<SubPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<SubPackage[]>("/api/subscriptions/packages")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        let found: SubPackage | undefined;
        if (packageIdParam) {
          found = list.find((p) => p.id === packageIdParam);
        } else {
          found = list.find((p) => p.name.toLowerCase() === planParam.toLowerCase());
        }
        setPkg(found ?? null);
      })
      .catch(() => { /* keep pkg null, show error */ })
      .finally(() => setLoading(false));
  }, [packageIdParam, planParam]);

  // Contact fields
  const [email,   setEmail]   = useState("");
  const [company, setCompany] = useState("");
  const [gstIn,   setGstIn]   = useState("");
  const [emailError, setEmailError] = useState("");

  // Pay state
  const [paying, setPaying] = useState(false);
  const [confirmedBreakdown, setConfirmedBreakdown] = useState<CreateOrderResponse["breakdown"] | null>(null);

  const basePrice = pkg
    ? (billingParam === "YEARLY" ? Number(pkg.priceYearly ?? 0) : Number(pkg.priceMonthly ?? 0))
    : 0;
  const basePaise    = confirmedBreakdown?.baseAmountPaise ?? basePrice * 100;
  const gstPaise     = confirmedBreakdown?.gstAmountPaise  ?? Math.round(basePaise * 0.18);
  const totalPaise   = confirmedBreakdown?.totalAmountPaise ?? basePaise + gstPaise;
  const isFree       = basePrice === 0;
  const features     = pkg ? pkgFeatures(pkg) : [];
  const isGrowth     = pkg?.name?.toLowerCase() === "growth";

  async function handlePay() {
    if (!email.trim()) { setEmailError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Enter a valid email"); return; }
    setEmailError("");

    if (!pkg) { toast({ type: "error", message: "Package not loaded." }); return; }
    if (isFree) { toast({ type: "info", message: "Free plan — no payment needed." }); return; }

    setPaying(true);

    try {
      // 1. Create Razorpay order on backend
      const orderRes = await apiFetch<CreateOrderResponse>("/api/subscriptions/orders", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ packageId: pkg.id, billingCycle: billingParam }),
      });
      const order = orderRes.data;

      // Sync displayed totals to backend-confirmed values (discounts may differ)
      setConfirmedBreakdown(order.breakdown);

      // 2. Load Razorpay checkout script
      await loadRazorpayScript();

      // 3. Open Razorpay modal
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency,
        name: "Cykruit",
        description: `${order.packageName} Plan · ${order.billingCycle}`,
        prefill: { email, name: company || undefined },
        notes: { gstIn: gstIn || "" },
        theme: { color: isGrowth ? "#7c3aed" : "#2563eb" },
        modal: {
          ondismiss: () => setPaying(false),
        },
        handler: (response) => {
          // Webhook handles actual activation. Redirect to success page immediately.
          router.push(
            `/employer/subscription/success?packageId=${pkg.id}&plan=${pkg.name.toLowerCase()}&billing=${billingParam.toLowerCase()}&amount=${order.amount}&paymentId=${response.razorpay_payment_id}`,
          );
        },
      });

      rzp.open();
    } catch (err) {
      setPaying(false);
      toast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to initiate payment",
      });
    }
  }

  const accentBtn  = isGrowth ? "bg-violet-600 hover:bg-violet-700 shadow-violet-500/25" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25";
  const accentText = isGrowth ? "text-violet-600" : "text-blue-600";

  const iCls = "w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400";
  const iErr = "border-red-300 focus:border-red-400 focus:ring-red-500/10";

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navbar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Shield className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-slate-900">Cykruit</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure Checkout</span>
        </div>
        <Link href="/employer/subscription" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* Left panel */}
        <div className="space-y-5">

          {/* Package not found */}
          {!loading && !pkg && (
            <div className="bg-white rounded-2xl border border-red-200 p-6 text-center">
              <p className="text-sm font-semibold text-red-600 mb-1">Package not found</p>
              <p className="text-xs text-slate-400 mb-4">The selected package could not be loaded. Please go back and try again.</p>
              <Link href="/employer/subscription" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline">
                <ChevronLeft className="w-3 h-3" /> Back to plans
              </Link>
            </div>
          )}

          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Contact &amp; Billing Info</h2>
              <p className="text-xs text-slate-400 mt-0.5">Receipt will be sent to this email.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  placeholder="billing@company.com"
                  className={`${iCls} ${emailError ? iErr : ""}`}
                />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Company name (optional)</label>
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="CyberShield Pvt. Ltd." className={iCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    GST number (optional)
                    <span className="ml-1 text-[10px] font-normal text-slate-400">required for GST invoice</span>
                  </label>
                  <input value={gstIn} onChange={(e) => setGstIn(e.target.value.toUpperCase())} placeholder="29AAAAA0000A1Z5" className={`${iCls} font-mono`} />
                </div>
              </div>
            </div>
          </div>

          {/* Payment via Razorpay */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Payment</h2>
              <p className="text-xs text-slate-400 mt-0.5">Processed securely by Razorpay — no card details stored on our servers.</p>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-4 mb-5">
                {[
                  { icon: CreditCard, label: "Credit / Debit Card" },
                  { icon: Smartphone, label: "UPI"                 },
                  { icon: Building2,  label: "Net Banking"         },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500 font-medium">
                    <Icon className="w-3.5 h-3.5 text-slate-400" /> {label}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                After clicking &quot;Pay&quot;, a Razorpay checkout window will open where you can complete payment using any supported method.
              </p>
            </div>
          </div>

          {/* Pay button */}
          {loading ? (
            <div className="flex items-center justify-center h-14">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={paying || !pkg || isFree}
              className={`w-full h-14 rounded-2xl text-white text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${accentBtn}`}
            >
              {paying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Opening Razorpay…
                </>
              ) : isFree ? (
                "Free plan — no payment needed"
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay {inr(totalPaise)} · Powered by Razorpay
                </>
              )}
            </button>
          )}

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1">
            {[
              { icon: "🔒", text: "256-bit SSL"       },
              { icon: "🛡️", text: "PCI DSS Compliant"  },
              { icon: "↩️", text: "Cancel anytime"     },
              { icon: "🧾", text: "GST invoice"        },
            ].map(({ icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>{icon}</span> {text}
              </span>
            ))}
          </div>

        </div>

        {/* Right panel — order summary */}
        <div className="sticky top-20">
          {loading ? (
            <div className="rounded-2xl bg-slate-900 h-72 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
            </div>
          ) : pkg ? (
            <div className="rounded-2xl bg-slate-900 text-white overflow-hidden shadow-xl">
              <div className={`px-6 py-5 border-b border-white/10 ${isGrowth ? "bg-violet-700/30" : "bg-blue-700/30"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {isGrowth ? <Zap className="w-4 h-4 text-violet-300" /> : <Shield className="w-4 h-4 text-blue-300" />}
                      <h3 className="text-base font-bold">{pkg.name} Plan</h3>
                    </div>
                    <p className="text-xs text-white/50 mt-0.5 capitalize">{billingParam.toLowerCase()} subscription</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">{inr(basePaise)}</p>
                    <p className="text-xs text-white/50">per {billingParam === "YEARLY" ? "year" : "month"}</p>
                  </div>
                </div>
              </div>

              {features.length > 0 && (
                <div className="px-6 py-4 border-b border-white/10">
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">What&apos;s included</p>
                  <ul className="space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" strokeWidth={2.5} /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="px-6 py-4 space-y-2.5">
                <div className="flex justify-between text-sm text-white/60">
                  <span>{pkg.name} plan ({billingParam.toLowerCase()})</span>
                  <span>{inr(basePaise)}</span>
                </div>
                <div className="flex justify-between text-sm text-white/60">
                  <span>GST (18%)</span>
                  <span>{inr(gstPaise)}</span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="flex justify-between text-base font-bold text-white">
                  <span>Total due today</span>
                  <span>{inr(totalPaise)}</span>
                </div>
              </div>

              <div className="px-6 pb-5">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    Subscription renews automatically. Cancel anytime from your dashboard.
                  </p>
                </div>
              </div>

              <div className="px-6 pb-5 flex items-center gap-2 border-t border-white/10 pt-4">
                <Lock className="w-3 h-3 text-white/30" />
                <span className="text-[10px] text-white/30 font-mono">Secured by Razorpay</span>
              </div>
            </div>
          ) : null}

          <p className="text-center text-xs text-slate-400 mt-4">
            Questions? <Link href="/contact" className={`font-semibold ${accentText} hover:underline`}>Contact support →</Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
