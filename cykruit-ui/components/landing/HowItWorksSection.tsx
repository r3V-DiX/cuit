import { UserPlus, FileSearch, Zap, CheckCircle } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Build a security-focused profile that highlights your certifications, CTF wins, tools, and specializations beyond just a resume.",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-200",
    stepColor: "text-blue-500",
    code: "profile.init()",
    accentLine: "via-blue-400",
  },
  {
    step: "02",
    icon: FileSearch,
    title: "Discover Matched Roles",
    description: "Our AI matches you with roles based on your actual skills and experience — not just keyword overlap. No more irrelevant listings.",
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50 border-cyan-200",
    stepColor: "text-cyan-500",
    code: "ai.match(profile)",
    accentLine: "via-cyan-400",
  },
  {
    step: "03",
    icon: Zap,
    title: "Apply in One Click",
    description: "Your profile IS your application. Apply instantly with your pre-built profile — no cover letters, no re-entering the same info.",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-200",
    stepColor: "text-purple-500",
    code: "job.apply(--fast)",
    accentLine: "via-purple-400",
  },
  {
    step: "04",
    icon: CheckCircle,
    title: "Get Hired",
    description: "Track every application, receive AI-scored feedback, and communicate directly with hiring teams — all in one place.",
    iconColor: "text-green-600",
    iconBg: "bg-green-50 border-green-200",
    stepColor: "text-green-500",
    code: "status: HIRED ✓",
    accentLine: "via-green-400",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
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
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            From Profile to Hired,{" "}
            <span className="text-blue-600">Fast</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Designed specifically for how security professionals actually find and evaluate jobs.
          </p>
        </div>

        {/* Steps with continuous connector line */}
        <div className="relative">
          {/* Dashed connector line — now with a blue gradient tint */}
          <div
            className="hidden lg:block absolute z-0"
            style={{ top: "27px", left: "28px", right: "28px", height: "2px" }}
          >
            <svg width="100%" height="2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="stepLine" x1="0" y1="0" x2="100%" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                  <stop offset="33%" stopColor="#06B6D4" stopOpacity="0.6" />
                  <stop offset="66%" stopColor="#A855F7" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <line x1="0" y1="1" x2="100%" y2="1" stroke="url(#stepLine)" strokeWidth="2" strokeDasharray="6 4" />
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(({ step, icon: Icon, title, description, iconColor, iconBg, stepColor, code }) => (
              <div key={step} className="group relative flex flex-col gap-4">
                {/* Icon box */}
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center ${iconBg} relative z-10 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-bold tracking-widest uppercase ${stepColor}`}>Step {step}</span>
                    <div className="inline-flex items-center px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                      <span className="text-[10px] font-mono text-green-400">{code}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
