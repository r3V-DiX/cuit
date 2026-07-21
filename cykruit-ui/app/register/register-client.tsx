"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, User, Building2, ArrowRight, ChevronLeft } from "lucide-react";

export default function RegisterClient() {
  const router = useRouter();
  return (
    <>


      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-80 bg-blue-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Circuit lines */}
      <svg className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-30 hidden sm:block" viewBox="0 0 260 260" fill="none">
        <path d="M260 50 L200 50 L200 10 L120 10" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M260 130 L190 130 L190 80 L100 80" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx="200" cy="50" r="3" fill="#3B82F6"/>
        <circle cx="190" cy="130" r="3" fill="#06B6D4"/>
      </svg>
      <svg className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none opacity-20 hidden sm:block" viewBox="0 0 260 260" fill="none">
        <path d="M0 200 L60 200 L60 240 L140 240" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M0 130 L70 130 L70 180 L160 180" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx="60" cy="200" r="3" fill="#3B82F6"/>
        <circle cx="70" cy="130" r="3" fill="#06B6D4"/>
      </svg>

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-blue-200 pointer-events-none hidden sm:block" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-blue-200 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-blue-200 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-blue-200 pointer-events-none hidden sm:block" />

      {/* Decorative — floating circles */}
      <div className="absolute top-[14%] left-[6%] w-40 h-40 rounded-full border-2 border-blue-200/50 pointer-events-none hidden sm:block" />
      <div className="absolute top-[17%] left-[8%] w-24 h-24 rounded-full border border-blue-300/35 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-[18%] right-[5%] w-52 h-52 rounded-full border-2 border-cyan-200/40 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-[21%] right-[7%] w-28 h-28 rounded-full border border-blue-200/30 pointer-events-none hidden sm:block" />
      <div className="absolute top-[52%] left-[3%] w-16 h-16 rounded-full bg-blue-400/6 border border-blue-300/25 pointer-events-none hidden sm:block" />
      <div className="absolute top-[32%] right-[4%] w-14 h-14 rounded-full bg-cyan-400/6 border border-cyan-300/30 pointer-events-none hidden sm:block" />

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

      {/* Decorative — terminal lines */}
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
        {[0,1,2,3,4,5,6,7,8].map((i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />)}
      </div>
      <div className="absolute top-[10%] left-[2%] grid grid-cols-3 gap-1.5 pointer-events-none opacity-20">
        {[0,1,2,3,4,5,6,7,8].map((i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />)}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo + back */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-600 transition-colors tracking-widest cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5" /> BACK
          </button>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Cykruit</span>
          </Link>
          <div className="w-16" />
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-blue-100 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-blue-100 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-blue-100 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-blue-100 pointer-events-none" />

          <div className="p-5 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-[10px] font-mono tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                AUTH.REGISTER
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Create your account</h1>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-green-400">auth.register()</span>
                </div>
              </div>
              <p className="text-sm text-slate-500">Choose how you want to use Cykruit</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Job Seeker */}
              <Link
                href="/register/seeker"
                className="group relative p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 text-left overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-slate-200 group-hover:border-blue-300 transition-colors" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-slate-200 group-hover:border-blue-300 transition-colors" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-slate-200 group-hover:border-blue-300 transition-colors" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-slate-200 group-hover:border-blue-300 transition-colors" />

                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform group-hover:bg-blue-100">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-semibold text-slate-900 mb-1">Job Seeker</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">Find your next cybersecurity role. Build a verified profile, browse roles, apply directly.</p>
                <span className="text-[10px] font-mono text-blue-600 tracking-widest flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  GET STARTED <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              {/* Employer */}
              <Link
                href="/register/employer"
                className="group relative p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50 transition-all duration-200 text-left overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-violet-400/0 via-violet-500 to-violet-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-slate-200 group-hover:border-violet-300 transition-colors" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-slate-200 group-hover:border-violet-300 transition-colors" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-slate-200 group-hover:border-violet-300 transition-colors" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-slate-200 group-hover:border-violet-300 transition-colors" />

                <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform group-hover:bg-violet-100">
                  <Building2 className="w-6 h-6 text-violet-600" />
                </div>
                <p className="font-semibold text-slate-900 mb-1">Employer</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">Hire verified cybersecurity talent. Post roles, use AI ranking, message candidates directly.</p>
                <span className="text-[10px] font-mono text-violet-600 tracking-widest flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  GET STARTED <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-mono text-slate-400 tracking-widest">VERIFIED · SECURE · ENCRYPTED</span>
        </div>
      </div>
    </>
  );
}
