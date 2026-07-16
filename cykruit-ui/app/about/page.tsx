import {
  Shield, Target, Zap, ArrowRight, Terminal,
  Globe, Heart, CheckCircle
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";

const values = [
  {
    icon: Shield,
    title: "Security First",
    desc: "Every decision we make starts with the safety and trust of our community — professionals and employers alike.",
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-100",
  },
  {
    icon: Target,
    title: "Built for Specificity",
    desc: "We reject the one-size-fits-all job board. Cybersecurity is a discipline, and it deserves a platform built for its nuances.",
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-100",
  },
  {
    icon: Heart,
    title: "Community Driven",
    desc: "We are practitioners who love this field. The platform evolves based on what the infosec community actually needs.",
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-100",
  },
  {
    icon: Zap,
    title: "Speed Matters",
    desc: "Good candidates are hired fast. We eliminate friction so professionals spend time on what matters — not forms.",
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-100",
  },
];


export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-16">

        {/* ── Hero ── */}
        <div className="relative bg-white border-b border-slate-200 overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none bg-grid-md" />

          {/* Circuit lines top-right */}
          <svg className="absolute top-0 right-0 w-80 h-80 pointer-events-none opacity-40" viewBox="0 0 280 280" fill="none">
            <path d="M280 60 L220 60 L220 20 L140 20" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
            <path d="M280 140 L200 140 L200 90 L110 90" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
            <path d="M280 210 L240 210 L240 160 L170 160 L170 110" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
            <circle cx="220" cy="60" r="3.5" fill="#3B82F6"/>
            <circle cx="200" cy="140" r="3.5" fill="#06B6D4"/>
            <circle cx="140" cy="20" r="3.5" fill="#3B82F6"/>
            <circle cx="240" cy="210" r="3.5" fill="#06B6D4"/>
          </svg>

          {/* Floating blob */}
          <div className="float-slow absolute top-8 left-12 w-24 h-16 pointer-events-none opacity-25 hidden lg:block" style={{
            background: "rgba(59,130,246,0.40)",
            borderRadius: "60% 40% 70% 30% / 50% 60% 40% 70%",
            filter: "blur(2px)",
          }} />

          {/* Corner brackets */}
          <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-mono tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              OUR STORY
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
              Built by Security People,{" "}
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 relative"
                style={{
                  background: "repeating-linear-gradient(0deg, #0a0f0a 0px, #0a0f0a 3px, #111a11 3px, #111a11 6px)",
                  fontFamily: "var(--font-terminal), monospace",
                  color: "#22c55e",
                  fontWeight: 400,
                  filter: "drop-shadow(0 0 8px rgba(34,197,94,0.35))",
                }}
              >
                For Security
                <span className="inline-block w-0.5 h-5 rounded-sm cursor-blink" style={{ background: "#22c55e" }} />
              </span>{" "}
              People
            </h1>

            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Cykruit was born out of frustration. Two security practitioners — sick of sifting through generic job boards that didn't understand what a red teamer actually does — decided to build the platform they always wished existed.
            </p>
          </div>
        </div>

        {/* ── Mission ── */}
        <div className="py-20 bg-white border-b border-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/40 to-transparent" />

          {/* Section corner brackets */}
          <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-blue-50 text-blue-600 border border-blue-100 mb-5 tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  OUR MISSION
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 leading-snug">
                  Close the Gap Between{" "}
                  <span className="text-blue-600">Security Talent</span>{" "}
                  and Security Work
                </h2>
                <p className="text-slate-500 leading-relaxed mb-5">
                  The global cybersecurity skills gap is approaching 4 million unfilled positions. That's not a pipeline problem — it's a discovery problem. Talented security professionals exist; they just can't find the right roles, and employers can't find them.
                </p>
                <p className="text-slate-500 leading-relaxed mb-8">
                  Cykruit is purpose-built infrastructure for this problem. We understand the difference between an AppSec engineer and a DevSecOps engineer. We know what OSCP means. We know that a Hack The Box Pro Hacker rank says more than three generic certifications. That domain knowledge is the foundation of everything we build.
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    "Verified employers only — no fake postings, no spam",
                    "AI matching that understands security specializations",
                    "Profiles that showcase CTF scores and hands-on skills",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — terminal card */}
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500/5 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <div className="flex items-center gap-1.5 ml-2">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-mono text-slate-400 tracking-wider">cykruit.mission</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { label: "PROBLEM", value: "4M+ unfilled security roles globally", color: "text-rose-600 bg-rose-50 border-rose-100" },
                      { label: "ROOT CAUSE", value: "Generic platforms don't speak security", color: "text-amber-600 bg-amber-50 border-amber-100" },
                      { label: "OUR FIX", value: "Domain-specific matching + verification", color: "text-blue-600 bg-blue-50 border-blue-100" },
                      { label: "RESULT", value: "12,000+ placements and counting", color: "text-green-600 bg-green-50 border-green-100" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
                        <span className="text-[9px] font-mono text-slate-400 tracking-widest shrink-0">{label}</span>
                        <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Values ── */}
        <div className="py-20 bg-slate-50 border-b border-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/40 to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-blue-50 text-blue-600 border border-blue-100 mb-4 tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                WHAT WE STAND FOR
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Our Values</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {values.map(({ icon: Icon, title, desc, color, bg }, i) => (
                <div key={title} className="group relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-slate-200 group-hover:border-blue-300 transition-colors" />
                  <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-slate-200 group-hover:border-blue-300 transition-colors" />
                  <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-slate-200 group-hover:border-blue-300 transition-colors" />
                  <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-slate-200 group-hover:border-blue-300 transition-colors" />

                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl border-2 ${bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <span className="text-[9px] font-mono text-slate-300 tracking-widest">0{i + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="py-20 bg-bg-darkest relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-100 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-blue-500/40 to-transparent" />

          {/* Corner brackets */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 pointer-events-none" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 pointer-events-none" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-blue-500/30 pointer-events-none" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-blue-500/30 pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-7 shadow-xl shadow-blue-500/30">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-mono tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              JOIN THE COMMUNITY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
              Be Part of What We&apos;re Building
            </h2>
            <p className="text-slate-400 mb-10 leading-relaxed max-w-xl mx-auto">
              Whether you&apos;re looking for your next security role or hiring top infosec talent, Cykruit was built for you. Join a growing community of security professionals who call this platform home.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button href="/register" variant="primary" size="lg">
                Create Free Profile
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button href="/jobs" variant="secondary" size="lg">
                Browse Jobs
              </Button>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
