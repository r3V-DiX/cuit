import { Brain, ShieldCheck, Trophy, Bell, MessageSquare, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Resume Scoring",
    description: "Each application gets an AI-generated score showing how well your profile matches the job requirements — before you apply.",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-100",
    tag: "AI-Powered",
    tagColor: "bg-blue-50 text-blue-600",
    id: "MOD.01",
  },
  {
    icon: Trophy,
    title: "CTF Profile Support",
    description: "Showcase your Hack The Box, CTFtime, and TryHackMe scores. Let your hands-on skills speak louder than certifications.",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-100",
    tag: "HTB · CTFtime",
    tagColor: "bg-amber-50 text-amber-600",
    id: "MOD.02",
  },
  {
    icon: ShieldCheck,
    title: "Verified Employers",
    description: "Every company posting on Cykruit goes through KYC verification. No spam, no fake postings — only real security teams.",
    iconColor: "text-green-600",
    iconBg: "bg-green-50 border-green-100",
    tag: "KYC Verified",
    tagColor: "bg-green-50 text-green-600",
    id: "MOD.03",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    description: "Talk to hiring managers and recruiters in real time. Skip the black hole — know exactly where your application stands.",
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50 border-cyan-100",
    tag: "Real-time",
    tagColor: "bg-cyan-50 text-cyan-600",
    id: "MOD.04",
  },
  {
    icon: Bell,
    title: "Smart Job Alerts",
    description: "Set up alerts based on your skills, domain, and location. Get notified the moment the right role is posted.",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-100",
    tag: "Skill-Matched",
    tagColor: "bg-purple-50 text-purple-600",
    id: "MOD.05",
  },
  {
    icon: BarChart3,
    title: "Application Analytics",
    description: "Track views, shortlists, and rejections with clear analytics. Understand what's working and optimize your profile accordingly.",
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50 border-rose-100",
    tag: "Dashboard",
    tagColor: "bg-rose-50 text-rose-600",
    id: "MOD.06",
  },
];

export default function FeaturesSection() {
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-blue-50 text-blue-600 border border-blue-100 mb-4 tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            PLATFORM FEATURES
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Built for Security Professionals,{" "}
            <span className="text-blue-600">By Security People</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Every feature was designed with the unique needs of the cybersecurity job market in mind.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description, iconColor, iconBg, tag, tagColor, id }) => (
            <div
              key={title}
              className="group relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/8 transition-all duration-200 overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Card corner brackets */}
              <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-slate-200 group-hover:border-blue-300 transition-colors duration-200" />
              <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-slate-200 group-hover:border-blue-300 transition-colors duration-200" />
              <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-slate-200 group-hover:border-blue-300 transition-colors duration-200" />
              <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-slate-200 group-hover:border-blue-300 transition-colors duration-200" />

              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${iconBg} group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                  <span className="text-[9px] font-mono text-slate-300 tracking-widest">{id}</span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
