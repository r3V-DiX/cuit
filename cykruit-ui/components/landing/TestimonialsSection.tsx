import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Arjun Mehta",
    role: "Senior Red Team Operator",
    company: "OffSec",
    avatar: "AM",
    avatarBg: "bg-blue-600",
    quote: "Cykruit understood what I actually do. I highlighted my HTB Pro Hacker rank and CRTO cert — the match quality was miles better than LinkedIn.",
    stars: 5,
    tag: "RED_TEAM",
  },
  {
    name: "Priya Nair",
    role: "Cloud Security Engineer",
    company: "Razorpay",
    avatar: "PN",
    avatarBg: "bg-cyan-600",
    quote: "Three interviews in two weeks after setting up my profile. The AI matching actually understood the difference between generic DevOps and cloud security.",
    stars: 5,
    tag: "CLOUD_SEC",
  },
  {
    name: "Rahul Singh",
    role: "SOC Lead",
    company: "Paytm",
    avatar: "RS",
    avatarBg: "bg-purple-600",
    quote: "Applied to 6 jobs in under 10 minutes. The one-click apply using my profile is a game changer — no more filling the same form 50 times.",
    stars: 5,
    tag: "SOC_OPS",
  },
  {
    name: "Kavya Reddy",
    role: "AppSec Engineer",
    company: "Zepto",
    avatar: "KR",
    avatarBg: "bg-green-600",
    quote: "I went from ghosted on other platforms to having real conversations with hiring managers within days. The direct messaging feature is incredible.",
    stars: 5,
    tag: "APP_SEC",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-16 bg-white border-t border-slate-200 relative overflow-hidden">
      {/* Dot grid */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

      {/* Glow lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/50 to-transparent" />

      {/* Section corner brackets */}
      <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
      <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-blue-200 pointer-events-none" />
      <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-blue-200 pointer-events-none" />
      <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-cyan-50 text-cyan-600 border border-cyan-100 mb-4 tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            SUCCESS STORIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Security Pros Love Cykruit
          </h2>
          <p className="text-slate-500">Real people, real placements, real results.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {testimonials.map(({ name, role, company, avatar, avatarBg, quote, stars, tag }) => (
            <div
              key={name}
              className="group relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col gap-4 overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500/70 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Card corner brackets */}
              <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-slate-200 group-hover:border-blue-300 transition-colors duration-200" />
              <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-slate-200 group-hover:border-blue-300 transition-colors duration-200" />
              <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-slate-200 group-hover:border-blue-300 transition-colors duration-200" />
              <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-slate-200 group-hover:border-blue-300 transition-colors duration-200" />

              <div className="flex items-start justify-between">
                <div className="flex gap-1">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-slate-300 tracking-widest">[ {tag} ]</span>
              </div>

              <div className="flex items-start gap-2 flex-1">
                <Quote className="w-4 h-4 text-blue-200 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 leading-relaxed">
                  {quote}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 group-hover:border-blue-100 transition-colors duration-200">
                <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center shrink-0`}>
                  <span className="text-xs font-bold text-white">{avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-400 font-mono">{role} · {company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
