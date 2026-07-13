"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Shield, ArrowRight, Building2, ChevronLeft, Lock, Mail, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, ApiError, authHeaders } from "@/lib/api";
import { broadcastLogin } from "@/lib/auth-sync";

const BLOCKED_DOMAINS = new Set([
  "gmail.com","yahoo.com","hotmail.com","outlook.com","live.com","aol.com",
  "icloud.com","me.com","mac.com","msn.com","ymail.com","rocketmail.com",
  "inbox.com","mail.com","protonmail.com","proton.me","tutanota.com",
  "tutamail.com","zoho.com","fastmail.com","hushmail.com","guerrillamail.com",
  "tempmail.com","throwam.com","sharklasers.com","mailnull.com",
  "yandex.com","yandex.ru","qq.com","163.com","126.com","rediffmail.com",
  "gmx.com","gmx.net","web.de","libero.it",
]);

function isPersonalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && BLOCKED_DOMAINS.has(domain);
}

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = value.padEnd(6, " ").split("");
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        disabled={disabled}
        maxLength={6}
        className="absolute inset-0 opacity-0 w-full cursor-text z-10"
        autoFocus
        aria-label="OTP code"
      />
      <div className="flex gap-2 cursor-text" onClick={() => inputRef.current?.focus()}>
        {digits.map((d, i) => (
          <div key={i} className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center text-xl font-bold font-mono transition-all ${
            value.length === i ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm" :
            d.trim() ? "border-slate-300 bg-white text-slate-900" : "border-slate-200 bg-slate-50 text-transparent"
          }`}>{d.trim() || "·"}</div>
        ))}
      </div>
    </div>
  );
}

export default function EmployerRegisterPage() {
  const [step, setStep] = useState<"info" | "otp">("info");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  function handleEmailChange(val: string) {
    setEmail(val);
    if (val && val.includes("@") && isPersonalEmail(val)) {
      setEmailError("Use a work email address (e.g. you@company.com). Personal email domains are not allowed.");
    } else {
      setEmailError("");
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    const id = setInterval(() => {
      setResendCooldown((c) => { if (c <= 1) { clearInterval(id); return 0; } return c - 1; });
    }, 1000);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) { toast({ type: "error", message: "First name is required" }); return; }
    if (!email.trim()) { toast({ type: "error", message: "Work email is required" }); return; }
    if (isPersonalEmail(email)) { setEmailError("Use a work email address."); return; }
    if (!agreed) { toast({ type: "error", message: "You must agree to the Terms of Service and Privacy Policy" }); return; }
    setLoading(true);
    try {
      await apiFetch("/api/auth/request-otp", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: email.trim().toLowerCase(), role: "EMPLOYER" }),
      });
      setStep("otp");
      startResendCooldown();
      toast({ type: "success", message: "OTP sent", description: "Check your inbox for a 6-digit code." });
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "EMAIL_DOMAIN_NOT_ALLOWED") {
        setEmailError(err.message);
        return;
      }
      toast({ type: "error", message: err.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { toast({ type: "error", message: "Enter the 6-digit OTP" }); return; }
    setLoading(true);
    try {
      const result = await apiFetch<any>("/api/auth/verify-otp", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          rememberMe: true,
        }),
      });
      broadcastLogin("EMPLOYER");
      toast({ type: "success", message: result.data?.isNewUser ? "Employer account created!" : "Welcome back!" });
      setTimeout(() => router.push("/kyc/employer"), 800);
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Invalid OTP" });
      if (err.code === "OTP_MAX_ATTEMPTS") { setStep("info"); setOtp(""); }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await apiFetch("/api/auth/request-otp", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: email.trim().toLowerCase(), role: "EMPLOYER" }),
      });
      setOtp("");
      startResendCooldown();
      toast({ type: "success", message: "New OTP sent" });
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Failed to resend OTP" });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setOauthLoading(true);
    try {
      const result = await apiFetch("/api/auth/google?role=EMPLOYER");
      if (result.data?.url) window.location.href = result.data.url;
      else toast({ type: "error", message: "Failed to get Google sign-in URL" });
    } catch {
      toast({ type: "error", message: "Failed to connect to authentication server" });
    } finally {
      setOauthLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-4 py-12">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.07) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-violet-200 pointer-events-none" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-violet-200 pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-violet-200 pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-violet-200 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => step === "otp" ? (setStep("info"), setOtp("")) : router.push("/register")}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-600 transition-colors tracking-widest cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {step === "otp" ? "CHANGE EMAIL" : "BACK"}
          </button>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Cykruit</span>
          </Link>
          <div className="w-12" />
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />
          <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-violet-100 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-violet-100 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-violet-100 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-violet-100 pointer-events-none" />

          <div className="p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                {step === "otp" ? <Mail className="w-5 h-5 text-violet-600" /> : <Building2 className="w-5 h-5 text-violet-600" />}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-violet-100 bg-violet-50 text-violet-600 text-xs font-mono tracking-widest mb-1.5">
                  <span className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
                  {step === "otp" ? "VERIFY OTP" : "EMPLOYER"}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {step === "otp" ? "Check your inbox" : "Create your account"}
                </h1>
                {step === "otp" && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    Code sent to <span className="font-mono font-medium text-slate-700">{email}</span>
                  </p>
                )}
              </div>
            </div>

            {step === "info" ? (
              <form className="space-y-4" onSubmit={handleSendOtp}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 tracking-widest mb-1.5 uppercase">First Name</label>
                    <input type="text" placeholder="Priya" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-violet-400 focus:bg-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 tracking-widest mb-1.5 uppercase">Last Name</label>
                    <input type="text" placeholder="Nair" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-violet-400 focus:bg-white transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 tracking-widest mb-1.5 uppercase">Work Email</label>
                  <input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:bg-white transition-all font-mono ${
                      emailError ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-violet-400"
                    }`} />
                  {emailError ? (
                    <p className="text-xs text-rose-500 mt-1.5 leading-snug">{emailError}</p>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono mt-1">Use your company email, not a personal one</p>
                  )}
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-violet-500" />
                  <span className="text-sm text-slate-500 leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-violet-600 hover:text-violet-700 transition-colors">Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-violet-600 hover:text-violet-700 transition-colors">Privacy Policy</Link>
                  </span>
                </label>

                <button type="submit" disabled={loading || !!emailError}
                  className="w-full h-11 rounded-xl bg-linear-to-r from-violet-500 to-violet-600 text-white text-base font-semibold hover:from-violet-400 hover:to-violet-500 shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <><Mail className="w-4 h-4" /> Send OTP <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-mono text-slate-400 tracking-widest">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <button type="button" onClick={handleGoogleSignIn} disabled={oauthLoading}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-base font-medium transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
                  {oauthLoading ? (
                    <svg className="w-4 h-4 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-xs font-mono text-slate-400 tracking-widest mb-3 uppercase">Enter OTP</label>
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                </div>

                <button type="submit" disabled={loading || otp.length !== 6}
                  className="w-full h-11 rounded-xl bg-linear-to-r from-violet-500 to-violet-600 text-white text-base font-semibold hover:from-violet-400 hover:to-violet-500 shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <>Create Employer Account <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2">
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <RefreshCw className="w-3.5 h-3.5" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400">OTP expires in 10 minutes</p>
              </form>
            )}

            <p className="text-center text-sm text-slate-500 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-mono text-slate-400 tracking-widest">VERIFIED · SECURE · ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}
