"use client";

import { useRouter } from "next/navigation";
import { Shield, Lock, Terminal, Bug, Wifi, Eye, Cpu, Crosshair, Binary, Network, Radio } from "lucide-react";
import SearchBox from "@/components/ui/SearchBox";

const cyberBadges = [
  { icon: Shield, label: "Penetration Testing", color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
  { icon: Terminal, label: "Red Team", color: "text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100" },
  { icon: Lock, label: "Zero Trust", color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100" },
  { icon: Bug, label: "Bug Bounty", color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100" },
  { icon: Wifi, label: "Cloud Security", color: "text-cyan-600 bg-cyan-50 border-cyan-200 hover:bg-cyan-100" },
  { icon: Eye, label: "Threat Intel", color: "text-green-600 bg-green-50 border-green-200 hover:bg-green-100" },
];

export default function HeroSection() {
  const router = useRouter();
  return (
    <section className="relative min-h-screen flex flex-col justify-center bg-white pt-16">

      {/* Decorative layer — overflow clipped here so dropdowns are unaffected */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Grid lines */}
      <div className="absolute inset-0 bg-grid-hero" />


      {/* Circuit lines — top-left */}
      <svg className="absolute top-16 left-0 w-80 h-80 pointer-events-none opacity-60" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 80 L40 80 L40 40 L120 40" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M0 140 L60 140 L60 80 L160 80" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M0 200 L30 200 L30 160 L100 160 L100 120" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx="40" cy="80" r="4" fill="#3B82F6"/>
        <circle cx="40" cy="40" r="4" fill="#3B82F6"/>
        <circle cx="60" cy="140" r="4" fill="#06B6D4"/>
        <circle cx="60" cy="80" r="4" fill="#06B6D4"/>
        <circle cx="30" cy="200" r="4" fill="#3B82F6"/>
        <circle cx="120" cy="40" r="4" fill="#3B82F6"/>
        <circle cx="160" cy="80" r="4" fill="#06B6D4"/>
      </svg>

      {/* Circuit lines — bottom-right */}
      <svg className="absolute bottom-0 right-0 w-80 h-80 pointer-events-none opacity-60" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M280 200 L240 200 L240 240 L160 240" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M280 140 L220 140 L220 200 L120 200" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M280 80 L250 80 L250 120 L180 120 L180 160" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx="240" cy="200" r="4" fill="#06B6D4"/>
        <circle cx="240" cy="240" r="4" fill="#06B6D4"/>
        <circle cx="220" cy="140" r="4" fill="#3B82F6"/>
        <circle cx="220" cy="200" r="4" fill="#3B82F6"/>
        <circle cx="160" cy="240" r="4" fill="#06B6D4"/>
      </svg>

      {/* Floating blob shapes */}
      <div
        className="float-slow absolute top-24 left-12 w-28 h-20 pointer-events-none opacity-40"
        style={{
          background: "rgba(59,130,246,0.35)",
          borderRadius: "60% 40% 70% 30% / 50% 60% 40% 70%",
          filter: "blur(2px)",
        }}
      />
      <div
        className="float-fast absolute bottom-32 right-20 w-24 h-32 pointer-events-none opacity-40"
        style={{
          background: "rgba(139,92,246,0.35)",
          borderRadius: "40% 60% 30% 70% / 70% 40% 60% 50%",
          filter: "blur(2px)",
        }}
      />

      {/* Floating glow orbs — scattered at edges */}
      <div className="float-slow absolute -top-20 -left-20 w-80 h-80 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.28) 0%, transparent 65%)" }}
      />
      <div className="float-medium absolute -top-10 -right-10 w-72 h-72 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.26) 0%, transparent 65%)" }}
      />
      <div className="float-fast absolute top-1/2 -left-16 w-64 h-64 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 65%)" }}
      />
      <div className="float-slow absolute -bottom-10 left-1/3 w-72 h-72 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.24) 0%, transparent 65%)" }}
      />
      <div className="float-medium absolute top-1/3 -right-16 w-64 h-64 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 65%)" }}
      />
      <div className="float-fast absolute -bottom-16 -right-10 w-80 h-80 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.20) 0%, transparent 65%)" }}
      />

      {/* Floating icons */}
      <div className="float-medium absolute top-28 right-16 opacity-20 hidden lg:block">
        <Cpu className="w-32 h-32 text-blue-500" strokeWidth={1} />
      </div>
      <div className="float-slow absolute bottom-28 left-16 opacity-20 hidden lg:block">
        <Crosshair className="w-28 h-28 text-cyan-500" strokeWidth={1} />
      </div>
      <div className="float-fast absolute top-1/2 -translate-y-1/2 right-10 opacity-15 hidden lg:block">
        <Shield className="w-24 h-24 text-blue-500" strokeWidth={1} />
      </div>
      <div className="float-medium absolute top-1/3 left-10 opacity-15 hidden lg:block">
        <Binary className="w-20 h-20 text-green-500" strokeWidth={1} />
      </div>
      <div className="float-slow absolute bottom-1/3 right-24 opacity-15 hidden lg:block">
        <Network className="w-20 h-20 text-cyan-500" strokeWidth={1} />
      </div>
      <div className="float-fast absolute top-20 left-1/3 opacity-10 hidden lg:block">
        <Radio className="w-16 h-16 text-purple-500" strokeWidth={1} />
      </div>
      <div className="float-medium absolute bottom-20 right-1/3 opacity-10 hidden lg:block">
        <Lock className="w-16 h-16 text-blue-400" strokeWidth={1} />
      </div>

      </div>{/* end decorative layer */}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">

        {/* Headline */}
        <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.06] tracking-tight mb-6">
          Find Your Next{" "}
          <br className="hidden sm:block" />
          <span className="inline-flex items-baseline gap-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1 mx-1 relative overflow-hidden"
              style={{
                background: "repeating-linear-gradient(0deg, #0a0f0a 0px, #0a0f0a 3px, #111a11 3px, #111a11 6px)",
                fontFamily: "var(--font-terminal), monospace",
                color: "#22c55e",
                fontSize: "inherit",
                fontWeight: 400,
                letterSpacing: "0.02em",
                filter: "drop-shadow(0 0 10px rgba(34,197,94,0.4)) drop-shadow(0 0 24px rgba(34,197,94,0.15))",
              }}
            >
              CyberSecurity
              <span
                className="inline-block w-0.75 rounded-sm cursor-blink self-stretch"
                style={{ background: "#22c55e", marginBottom: "4px" }}
              />
            </span>
          </span>{" "}
          Role
        </h1>

        <div className="inline-block mb-10 px-5 py-3 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
            The job platform built <span className="font-semibold text-slate-800">exclusively</span> for the infosec community — red teamers, cloud security engineers, SOC analysts, and everyone in between.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-10 max-w-2xl mx-auto">
          <SearchBox
            size="lg"
            placeholder="Search roles, skills, companies…"
            onSearch={(q) => router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs")}
          />
        </div>

        {/* Cyber role badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {cyberBadges.map(({ icon: Icon, label, color }) => (
            <button
              key={label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${color}`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-green-200 shadow-sm shadow-green-100">
            <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Verified employers only</span>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-blue-200 shadow-sm shadow-blue-100">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Free for job seekers</span>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-cyan-200 shadow-sm shadow-cyan-100">
            <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center shrink-0">
              <Cpu className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">AI-powered matching</span>
          </div>
        </div>
      </div>
    </section>
  );
}
