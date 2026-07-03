"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Eye, EyeOff, ArrowRight, User, ChevronLeft, Lock } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

function getPasswordStrength(p: string): { score: number; label: string; color: string; bars: string } {
  if (!p) return { score: 0, label: "", color: "", bars: "" };
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { score, label: "Weak",   color: "bg-rose-500",   bars: "text-rose-500" };
  if (score <= 2) return { score, label: "Fair",   color: "bg-amber-400",  bars: "text-amber-500" };
  if (score <= 3) return { score, label: "Good",   color: "bg-blue-500",   bars: "text-blue-500" };
  return               { score, label: "Strong", color: "bg-green-500",  bars: "text-green-600" };
}

export default function SeekerRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [agreed,    setAgreed]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const { toast } = useToast();

  const strength = getPasswordStrength(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) { toast({ type: "error", message: "First name is required" }); return; }
    if (!email.trim())     { toast({ type: "error", message: "Email is required" }); return; }
    if (password.length < 8) { toast({ type: "error", message: "Password must be at least 8 characters" }); return; }
    if (password !== confirm)  { toast({ type: "error", message: "Passwords do not match" }); return; }
    if (!agreed) { toast({ type: "error", message: "You must agree to the Terms of Service and Privacy Policy" }); return; }
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1200));
    toast({ type: "success", message: "Account created!", description: "Welcome to Cykruit." });
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-80 bg-blue-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Circuit lines — top right */}
      <svg className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-30" viewBox="0 0 260 260" fill="none">
        <path d="M260 50 L200 50 L200 10 L120 10" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M260 130 L190 130 L190 80 L100 80" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx="200" cy="50" r="3" fill="#3B82F6"/>
        <circle cx="190" cy="130" r="3" fill="#06B6D4"/>
      </svg>

      {/* Circuit lines — bottom left */}
      <svg className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none opacity-20" viewBox="0 0 260 260" fill="none">
        <path d="M0 210 L60 210 L60 250 L140 250" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M0 130 L70 130 L70 180 L160 180" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx="60" cy="210" r="3" fill="#3B82F6"/>
        <circle cx="70" cy="130" r="3" fill="#06B6D4"/>
      </svg>

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-blue-200 pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-blue-200 pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

      {/* Decorative — floating circles */}
      <div className="absolute top-[14%] left-[6%] w-40 h-40 rounded-full border-2 border-blue-200/50 pointer-events-none" />
      <div className="absolute top-[17%] left-[8%] w-24 h-24 rounded-full border border-blue-300/35 pointer-events-none" />
      <div className="absolute bottom-[18%] right-[5%] w-52 h-52 rounded-full border-2 border-cyan-200/40 pointer-events-none" />
      <div className="absolute bottom-[21%] right-[7%] w-28 h-28 rounded-full border border-blue-200/30 pointer-events-none" />
      <div className="absolute top-[52%] left-[3%] w-16 h-16 rounded-full bg-blue-400/6 border border-blue-300/25 pointer-events-none" />
      <div className="absolute top-[32%] right-[4%] w-14 h-14 rounded-full bg-cyan-400/6 border border-cyan-300/30 pointer-events-none" />

      {/* Decorative — shield icons */}
      <svg className="absolute top-[13%] right-[10%] w-16 h-16 pointer-events-none opacity-15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
      </svg>
      <svg className="absolute bottom-[28%] left-[7%] w-20 h-20 pointer-events-none opacity-12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="0.8">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
      </svg>
      <svg className="absolute top-[65%] right-[8%] w-12 h-12 pointer-events-none opacity-18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.2">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
      </svg>

      {/* Decorative — lock icon */}
      <svg className="absolute top-[40%] left-[5%] w-14 h-14 pointer-events-none opacity-15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.2">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>

      {/* Decorative — hex rings */}
      <svg className="absolute top-[6%] left-[18%] w-24 h-24 pointer-events-none opacity-15" viewBox="0 0 60 60" fill="none">
        <polygon points="30,4 52,17 52,43 30,56 8,43 8,17" stroke="#3B82F6" strokeWidth="1.2"/>
        <polygon points="30,12 46,21 46,39 30,48 14,39 14,21" stroke="#06B6D4" strokeWidth="0.8"/>
      </svg>
      <svg className="absolute bottom-[8%] right-[15%] w-28 h-28 pointer-events-none opacity-12" viewBox="0 0 60 60" fill="none">
        <polygon points="30,4 52,17 52,43 30,56 8,43 8,17" stroke="#3B82F6" strokeWidth="1"/>
        <polygon points="30,12 46,21 46,39 30,48 14,39 14,21" stroke="#06B6D4" strokeWidth="0.6"/>
      </svg>
      <svg className="absolute top-[75%] left-[18%] w-16 h-16 pointer-events-none opacity-15" viewBox="0 0 60 60" fill="none">
        <polygon points="30,4 52,17 52,43 30,56 8,43 8,17" stroke="#06B6D4" strokeWidth="1.2"/>
      </svg>

      {/* Decorative — terminal / scan lines */}
      <div className="absolute top-[26%] right-[12%] pointer-events-none opacity-25 font-mono text-[10px] text-blue-500 space-y-1 leading-tight">
        <div>&gt; SCAN_INIT...</div>
        <div>AUTH_TOKEN: 0xf3a1</div>
        <div>STATUS: OK</div>
      </div>
      <div className="absolute bottom-[16%] left-[11%] pointer-events-none opacity-20 font-mono text-[10px] text-cyan-600 space-y-1 leading-tight">
        <div>[SYS] encrypt::aes256</div>
        <div>[SYS] tls::handshake</div>
        <div>[SYS] cert::verified</div>
      </div>

      {/* Decorative — dot clusters */}
      <div className="absolute top-[45%] right-[2%] grid grid-cols-3 gap-1.5 pointer-events-none opacity-25">
        {Array.from({length: 9}).map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />)}
      </div>
      <div className="absolute top-[10%] left-[2%] grid grid-cols-3 gap-1.5 pointer-events-none opacity-20">
        {Array.from({length: 9}).map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />)}
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo + back */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/register" className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-600 transition-colors tracking-widest">
            <ChevronLeft className="w-3.5 h-3.5" /> BACK
          </Link>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Cykruit</span>
          </Link>
          <div className="w-12" />
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-blue-100 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-blue-100 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-blue-100 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-blue-100 pointer-events-none" />

          <div className="p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-[10px] font-mono tracking-widest mb-1.5">
                  <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" /> JOB SEEKER
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">Create your profile</h1>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-green-400">profile.init()</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google */}
            <button type="button" onClick={() => toast({ type: "info", message: "Google sign-up coming soon" })}
              className="w-full h-11 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm mb-5">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] font-mono text-slate-400 tracking-widest">OR</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 tracking-widest mb-1.5 uppercase">First Name</label>
                  <input type="text" placeholder="Aryan" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 tracking-widest mb-1.5 uppercase">Last Name</label>
                  <input type="text" placeholder="Mehta" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 tracking-widest mb-1.5 uppercase">Email</label>
                <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-mono" />
              </div>

              {/* Password with strength */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 tracking-widest mb-1.5 uppercase">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-mono" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength indicator */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength.score >= i ? strength.color : "bg-slate-200"
                        }`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold font-mono ${strength.bars}`}>{strength.label}</span>
                      <span className="text-[10px] text-slate-400">
                        {strength.score < 3 && "Add uppercase, numbers or symbols"}
                        {strength.score === 3 && "Add a symbol to make it stronger"}
                        {strength.score >= 4 && "Great password!"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 tracking-widest mb-1.5 uppercase">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} placeholder="••••••••••" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full h-10 px-3.5 pr-10 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white transition-all font-mono ${
                      confirm && confirm !== password ? "border-rose-300 focus:border-rose-400" :
                      confirm && confirm === password ? "border-green-300 focus:border-green-400" :
                      "border-slate-200 focus:border-blue-400"
                    }`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="text-[10px] text-rose-500 font-mono mt-1">Passwords do not match</p>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-blue-500" />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700 transition-colors">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700 transition-colors">Privacy Policy</Link>
                </span>
              </label>

              <button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:from-blue-400 hover:to-blue-500 shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg> Creating…</>
                ) : (
                  <>Create Profile <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-5">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-mono text-slate-400 tracking-widest">VERIFIED · SECURE · ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}
