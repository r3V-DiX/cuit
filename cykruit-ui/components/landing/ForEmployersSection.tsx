import { CheckCircle, ArrowRight, Terminal } from "lucide-react";
import Button from "@/components/ui/Button";

const benefits = [
  "Post jobs in minutes with AI-assisted JD generation",
  "Access pre-screened, verified cybersecurity professionals",
  "AI-powered candidate ranking and resume scoring",
  "Direct messaging with shortlisted candidates",
  "Real-time application status tracking",
  "Dedicated employer dashboard with analytics",
];

export default function ForEmployersSection() {
  return (
    <section className="py-16 bg-slate-100 border-t border-slate-200 relative overflow-hidden">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-blue-50 text-blue-600 border border-blue-100 mb-4 tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              FOR EMPLOYERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5 leading-snug">
              Hire Security Talent{" "}
              <span className="text-blue-600">10x Faster</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8">
              Stop sifting through unqualified resumes. Cykruit&apos;s talent pool
              is exclusively cybersecurity professionals, so every applicant
              actually understands your tech stack.
            </p>

            <ul className="flex flex-col gap-3 mb-10">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-4.5 h-4.5 text-green-500 mt-0.5 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <Button href="/employers" variant="primary" size="md">
                Post a Job
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button href="/employers" variant="outline-light" size="md">
                Learn More
              </Button>
            </div>
          </div>

          {/* Right — mock dashboard */}
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/5 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80 overflow-hidden">
              {/* Terminal header bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-mono text-slate-400 tracking-wider">employer.dashboard</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">Active Listings</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">
                    3 Active
                  </span>
                </div>

                {[
                  { title: "Senior Pentester", apps: 24, match: "92%" },
                  { title: "Cloud Security Eng", apps: 18, match: "88%" },
                  { title: "SOC Analyst II", apps: 41, match: "95%" },
                ].map((job) => (
                  <div key={job.title} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-400 font-mono">{job.apps} applicants</p>
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full font-mono">
                      {job.match} match
                    </span>
                  </div>
                ))}

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">
                    AI Insight: 3 top candidates match your Senior Pentester role above 90%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
