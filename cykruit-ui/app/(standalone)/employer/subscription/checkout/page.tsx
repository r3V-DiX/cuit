"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import {
  Shield, Lock, Check, ChevronLeft, Zap,
  Eye, EyeOff, Tag, ChevronDown, Info,
} from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────
const PLANS: Record<string, {
  name: string; monthlyPrice: number; yearlyPrice: number;
  features: string[]; color: string; badge?: string;
}> = {
  starter: {
    name: "Starter", monthlyPrice: 3999, yearlyPrice: 3199,
    features: ["5 active job listings", "Basic applicant tracking", "Company profile", "Email support", "Standard search visibility", "CSV export"],
    color: "blue",
  },
  growth: {
    name: "Growth", monthlyPrice: 9999, yearlyPrice: 7999,
    features: ["25 active job listings", "AI candidate scoring & ranking", "Priority search placement", "3 team seats", "Advanced applicant tracking", "Analytics dashboard", "Bulk messaging", "Priority email & chat support"],
    color: "violet", badge: "Most Popular",
  },
};

const VALID_COUPONS: Record<string, { label: string; pct: number }> = {
  "LAUNCH20": { label: "Launch Offer", pct: 20 },
  "CYBER10":  { label: "Cyber10",      pct: 10 },
};

function inr(n: number) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
function cardBrand(num: string) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n))        return "visa";
  if (/^5[1-5]/.test(n))   return "mc";
  if (/^3[47]/.test(n))    return "amex";
  if (/^6[0-9]/.test(n))   return "rupay";
  return null;
}

// ── Card brand SVGs ───────────────────────────────────────────────────────────
function BrandIcon({ brand }: { brand: string | null }) {
  if (brand === "visa")  return <svg className="h-5" viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#1A1F71"/><text x="6" y="22" fill="white" fontSize="14" fontFamily="Arial" fontWeight="bold">VISA</text></svg>;
  if (brand === "mc")    return <svg className="h-5" viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#fff" stroke="#e2e8f0"/><circle cx="18" cy="16" r="9" fill="#EB001B"/><circle cx="30" cy="16" r="9" fill="#F79E1B"/><path d="M24 9a9 9 0 010 14A9 9 0 0124 9z" fill="#FF5F00"/></svg>;
  if (brand === "amex")  return <svg className="h-5" viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#2E77BC"/><text x="5" y="22" fill="white" fontSize="11" fontFamily="Arial" fontWeight="bold">AMEX</text></svg>;
  if (brand === "rupay") return <svg className="h-5" viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#1a1a2e"/><text x="4" y="22" fill="#F97316" fontSize="11" fontFamily="Arial" fontWeight="bold">RuPay</text></svg>;
  return null;
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const iCls = "w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400";
const iErr = "border-red-300 focus:border-red-400 focus:ring-red-500/10";

// ── Main ──────────────────────────────────────────────────────────────────────
function CheckoutContent() {
  const params    = useSearchParams();
  const router    = useRouter();
  const { toast } = useToast();

  const planId  = params.get("plan") || "growth";
  const billing = (params.get("billing") || "monthly") as "monthly" | "yearly";
  const plan    = PLANS[planId] || PLANS.growth;
  const yearly  = billing === "yearly";
  const basePrice = yearly ? plan.yearlyPrice : plan.monthlyPrice;

  // Coupon
  const [couponInput, setCouponInput]   = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<null | { code: string; label: string; pct: number }>(null);
  const [couponError, setCouponError]   = useState("");
  const [couponOpen, setCouponOpen]     = useState(false);

  const discount    = appliedCoupon ? Math.round(basePrice * appliedCoupon.pct / 100) : 0;
  const afterDiscount = basePrice - discount;
  const gst         = Math.round(afterDiscount * 0.18);
  const total       = afterDiscount + gst;

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const c = VALID_COUPONS[code];
    if (c) {
      setAppliedCoupon({ code, ...c });
      setCouponError("");
      toast({ type: "success", message: `Coupon applied — ${c.pct}% off!` });
    } else {
      setCouponError("Invalid or expired coupon code.");
      setAppliedCoupon(null);
    }
  }

  // Payment method tab
  const [payMethod, setPayMethod] = useState<"card" | "upi" | "netbanking">("card");

  // Card fields + errors
  const [cardNumber, setCardNumber] = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvv,        setCvv]        = useState("");
  const [cardName,   setCardName]   = useState("");
  const [showCvv,    setShowCvv]    = useState(false);
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // UPI
  const [upiId, setUpiId]     = useState("");
  const [upiError, setUpiError] = useState("");

  // Net banking
  const [bank, setBank] = useState("");

  // Contact
  const [email,   setEmail]   = useState("");
  const [company, setCompany] = useState("");
  const [gstIn,   setGstIn]   = useState("");
  const [emailError, setEmailError] = useState("");

  const [loading, setLoading] = useState(false);
  const brand = cardBrand(cardNumber);

  function validateAndPay() {
    const errs: Record<string, string> = {};
    if (!email.trim())               setEmailError("Email is required");
    else if (!/\S+@\S+\.\S+/.test(email)) setEmailError("Enter a valid email");
    else                             setEmailError("");

    if (payMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length < 16) errs.cardNumber = "Enter a valid 16-digit card number";
      if (expiry.length < 5)    errs.expiry  = "Enter expiry as MM/YY";
      if (cvv.length < 3)       errs.cvv     = "Enter CVV";
      if (!cardName.trim())     errs.cardName = "Enter name on card";
      setCardErrors(errs);
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email) || Object.keys(errs).length) return;
    }
    if (payMethod === "upi") {
      if (!/^[\w.\-]{2,}@[\w]{2,}$/.test(upiId)) { setUpiError("Enter a valid UPI ID (e.g. name@upi)"); return; }
      setUpiError("");
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return;
    }
    if (payMethod === "netbanking" && !bank) {
      toast({ type: "error", message: "Select a bank" }); return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(`/employer/subscription/success?plan=${planId}&billing=${billing}&amount=${total}`);
    }, 2200);
  }

  const accentBtn = plan.color === "violet" ? "bg-violet-600 hover:bg-violet-700 shadow-violet-500/25" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25";
  const accentText = plan.color === "violet" ? "text-violet-600" : "text-blue-600";

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Navbar ── */}
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

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="space-y-5">

          {/* ── Contact info ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Contact & Billing Info</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your receipt will be sent to the email below.</p>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Email address" error={emailError}>
                <input
                  type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  placeholder="billing@company.com"
                  className={`${iCls} ${emailError ? iErr : ""}`}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company name (optional)">
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="CyberShield Pvt. Ltd." className={iCls} />
                </Field>
                <Field label="GST number (optional)" hint="Required for GST invoice">
                  <input value={gstIn} onChange={(e) => setGstIn(e.target.value.toUpperCase())} placeholder="29AAAAA0000A1Z5" className={`${iCls} font-mono`} />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Payment method ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-0 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 mb-4">Payment Method</h2>
              {/* Tabs */}
              <div className="flex gap-0 -mb-px">
                {([
                  { id: "card",       label: "Credit / Debit Card" },
                  { id: "upi",        label: "UPI"                 },
                  { id: "netbanking", label: "Net Banking"         },
                ] as { id: "card"|"upi"|"netbanking"; label: string }[]).map((t) => (
                  <button
                    key={t.id} onClick={() => setPayMethod(t.id)}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      payMethod === t.id
                        ? `border-blue-600 text-blue-600`
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-4">

              {/* ── Card tab ── */}
              {payMethod === "card" && (
                <>
                  <Field label="Card number" error={cardErrors.cardNumber}>
                    <div className="relative">
                      <input
                        value={cardNumber}
                        onChange={(e) => { setCardNumber(formatCard(e.target.value)); setCardErrors((p) => ({ ...p, cardNumber: "" })); }}
                        placeholder="1234  5678  9012  3456"
                        className={`${iCls} font-mono pr-28 tracking-widest ${cardErrors.cardNumber ? iErr : ""}`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <BrandIcon brand={brand} />
                      </div>
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Expiry date" error={cardErrors.expiry}>
                      <input
                        value={expiry}
                        onChange={(e) => { setExpiry(formatExpiry(e.target.value)); setCardErrors((p) => ({ ...p, expiry: "" })); }}
                        placeholder="MM / YY"
                        className={`${iCls} font-mono ${cardErrors.expiry ? iErr : ""}`}
                      />
                    </Field>
                    <Field label={<span className="flex items-center gap-1">CVV <Info className="w-3 h-3 text-slate-300" /></span> as unknown as string} error={cardErrors.cvv}>
                      <div className="relative">
                        <input
                          type={showCvv ? "text" : "password"}
                          value={cvv}
                          onChange={(e) => { setCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); setCardErrors((p) => ({ ...p, cvv: "" })); }}
                          placeholder="•••"
                          className={`${iCls} font-mono pr-10 ${cardErrors.cvv ? iErr : ""}`}
                        />
                        <button type="button" onClick={() => setShowCvv(!showCvv)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                          {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>
                  </div>

                  <Field label="Name on card" error={cardErrors.cardName}>
                    <input
                      value={cardName} onChange={(e) => { setCardName(e.target.value); setCardErrors((p) => ({ ...p, cardName: "" })); }}
                      placeholder="As printed on card"
                      className={`${iCls} ${cardErrors.cardName ? iErr : ""}`}
                    />
                  </Field>

                  {/* Save card toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div className="w-4 h-4 rounded border-2 border-slate-300 flex items-center justify-center">
                    </div>
                    <span className="text-sm text-slate-500">Save card for future payments</span>
                  </label>
                </>
              )}

              {/* ── UPI tab ── */}
              {payMethod === "upi" && (
                <div className="space-y-4">
                  <Field label="UPI ID" error={upiError} hint="e.g. yourname@oksbi or mobile@paytm">
                    <input
                      value={upiId} onChange={(e) => { setUpiId(e.target.value); setUpiError(""); }}
                      placeholder="yourname@upi"
                      className={`${iCls} font-mono ${upiError ? iErr : ""}`}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: "GPay",   color: "bg-white border-slate-200" },
                      { label: "PhonePe",color: "bg-white border-slate-200" },
                      { label: "Paytm",  color: "bg-white border-slate-200" },
                      { label: "BHIM",   color: "bg-white border-slate-200" },
                    ].map((app) => (
                      <button
                        key={app.label} type="button"
                        className={`h-9 px-4 rounded-lg border text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer ${app.color}`}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">A payment request will be sent to your UPI app. Approve it within 10 minutes.</p>
                  </div>
                </div>
              )}

              {/* ── Net Banking tab ── */}
              {payMethod === "netbanking" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Yes Bank", "PNB", "Bank of Baroda"].map((b) => (
                      <button
                        key={b} type="button" onClick={() => setBank(b)}
                        className={`h-12 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          bank === b
                            ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <select
                      value={bank} onChange={(e) => setBank(e.target.value)}
                      className={`${iCls} appearance-none`}
                    >
                      <option value="">All banks — select from list</option>
                      {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Yes Bank", "PNB", "Bank of Baroda", "Canara Bank", "Union Bank", "Indian Bank", "IDBI", "Federal Bank", "IndusInd"].map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── Coupon ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setCouponOpen(!couponOpen)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                {appliedCoupon ? <span className="text-emerald-600">Coupon applied: <span className="font-mono">{appliedCoupon.code}</span> (–{appliedCoupon.pct}%)</span> : "Have a coupon code?"}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${couponOpen ? "rotate-180" : ""}`} />
            </button>
            {couponOpen && (
              <div className="px-6 pb-5">
                <div className="flex gap-2">
                  <input
                    value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                    placeholder="Enter code"
                    className={`${iCls} font-mono flex-1 ${couponError ? iErr : ""}`}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  />
                  <button onClick={applyCoupon} className="h-11 px-5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors cursor-pointer shrink-0">
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex items-center justify-between mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-xs text-emerald-700 font-semibold">✓ {appliedCoupon.label} — {appliedCoupon.pct}% off applied</span>
                    <button onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer">Remove</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Pay button ── */}
          <button
            onClick={validateAndPay}
            disabled={loading}
            className={`w-full h-13 rounded-2xl text-white text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer py-3.5 ${accentBtn}`}
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Processing payment…
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay {inr(total)} {yearly ? "/ year" : "/ month"}
              </>
            )}
          </button>

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

        {/* ══════════════ RIGHT PANEL — Order Summary ══════════════ */}
        <div className="sticky top-20">
          <div className="rounded-2xl bg-slate-900 text-white overflow-hidden shadow-xl">
            {/* Plan header */}
            <div className={`px-6 py-5 border-b border-white/10 ${plan.color === "violet" ? "bg-violet-700/30" : "bg-blue-700/30"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  {plan.badge && (
                    <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/15 text-white mb-2">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {plan.color === "violet" ? <Zap className="w-4 h-4 text-violet-300" /> : <Shield className="w-4 h-4 text-blue-300" />}
                    <h3 className="text-base font-bold">{plan.name} Plan</h3>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5 capitalize">{billing} subscription</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold">{inr(basePrice)}</p>
                  <p className="text-xs text-white/50">per {yearly ? "year" : "month"}</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="px-6 py-4 border-b border-white/10">
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">What&apos;s included</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing breakdown */}
            <div className="px-6 py-4 space-y-2.5">
              <div className="flex justify-between text-sm text-white/60">
                <span>{plan.name} plan ({billing})</span>
                <span>{inr(basePrice)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-400 font-semibold">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>–{inr(discount)}</span>
                </div>
              )}
              {yearly && !appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-400 font-semibold">
                  <span>Annual discount</span>
                  <span>–20%</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-white/60">
                <span>GST (18%)</span>
                <span>{inr(gst)}</span>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex justify-between text-base font-bold text-white">
                <span>Total due today</span>
                <span>{inr(total)}</span>
              </div>
              {yearly && (
                <div className="flex justify-between text-xs text-emerald-400/80">
                  <span>You save vs monthly</span>
                  <span>{inr((plan.monthlyPrice - plan.yearlyPrice) * 12)} / year</span>
                </div>
              )}
            </div>

            {/* Renewal note */}
            <div className="px-6 pb-5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-white/40 leading-relaxed">
                  Your subscription renews automatically. Cancel anytime from your dashboard — no questions asked.
                </p>
              </div>
            </div>

            {/* Powered by */}
            <div className="px-6 pb-5 flex items-center gap-2 border-t border-white/10 pt-4">
              <Lock className="w-3 h-3 text-white/30" />
              <span className="text-[10px] text-white/30 font-mono">Secured by Razorpay</span>
            </div>
          </div>

          {/* Help link */}
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
