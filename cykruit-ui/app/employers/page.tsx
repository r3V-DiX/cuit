import type { Metadata } from "next";
import {
  Shield, CheckCircle, ArrowRight, Terminal, Zap, Users,
  BarChart3, MessageSquare, Brain, Clock, Lock, TrendingUp,
  Star, Building2
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hire Cybersecurity Talent",
  description:
    "Post jobs and connect with verified cybersecurity professionals. AI-powered candidate matching, resume access, and team collaboration tools.",
  alternates: { canonical: "/employers" },
  openGraph: { url: "/employers" },
};
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import type { Testimonial } from "@/components/landing/TestimonialsSection";

const PUBLIC_URL = process.env.PUBLIC_SERVICE_URL || "http://127.0.0.1:4006";

async function getEmployerTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${PUBLIC_URL}/public/testimonials?type=EMPLOYER`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    const raw = body?.data;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

const features = [
  {
    icon: Brain,
    title: "AI-Powered Candidate Ranking",
    desc: "Our engine ranks every applicant against your job requirements — factoring in certs, CTF scores, tool proficiency, and experience depth. You see the best fits first.",
    id: "FEAT.01",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100",
  },
  {
    icon: Shield,
    title: "KYC-Verified Talent Pool",
    desc: "Every professional on Cykruit has a verified profile. No ghost applicants, no keyword-stuffed CVs — just real practitioners with proven skills.",
    id: "FEAT.02",
    color: "text-green-600",
    bg: "bg-green-50 border-green-100",
  },
  {
    icon: Zap,
    title: "AI-Assisted JD Generation",
    desc: "Describe the role in plain English and our AI generates a precise, jargon-correct job description tailored to cybersecurity hiring standards.",
    id: "FEAT.03",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
  },
  {
    icon: MessageSquare,
    title: "Direct Candidate Messaging",
    desc: "Skip the email chains. Message shortlisted candidates directly from the dashboard. They're notified instantly and can respond in-platform.",
    id: "FEAT.04",
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-100",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Track views, applications, shortlist rates, and time-to-fill for every role. Understand what's working and optimize your hiring funnel.",
    id: "FEAT.05",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-100",
  },
  {
    icon: Clock,
    title: "Post in Minutes",
    desc: "Go from zero to live job posting in under 5 minutes. No long forms, no waiting for approval — our verification is done at onboarding.",
    id: "FEAT.06",
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-100",
  },
];

const benefits = [
  "Exclusively cybersecurity candidates — zero noise from unrelated applicants",
  "Pre-screened profiles with verified skills, certs, and hands-on project history",
  "AI candidate ranking so your team reviews the top 10%, not all 200",
  "Direct messaging with candidates — no third-party recruiter middlemen",
  "Real-time application tracking and hiring funnel analytics",
  "Dedicated employer success support for your first three hires",
];


const steps = [
  {
    step: "01",
    title: "Create Your Employer Account",
    desc: "Sign up and complete KYC verification. Takes less than 10 minutes. We verify all employers before any posting goes live.",
    code: "employer.signup()",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  {
    step: "02",
    title: "Post Your Role",
    desc: "Use our AI-assisted JD builder or paste your own. Set your requirements, tags, and work mode. Go live instantly.",
    code: "job.post(--ai)",
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-200",
  },
  {
    step: "03",
    title: "Review AI-Ranked Candidates",
    desc: "Applications arrive ranked by match score. See CTF profiles, cert stacks, and skill breakdowns at a glance.",
    code: "candidates.rank()",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
  },
  {
    step: "04",
    title: "Hire Faster",
    desc: "Message shortlisted candidates directly, schedule interviews, and close offers — all from your employer dashboard.",
    code: "status: HIRED ✓",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
  },
];

export default async function EmployersPage() {
  const testimonials = await getEmployerTestimonials();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-16">

        {/* ── Hero ── */}
        <div className="relative bg-white border-b border-slate-200 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-grid-md" />

          {/* Circuit lines */}
          <svg className="absolute top-0 right-0 w-80 h-80 pointer-events-none opacity-40" viewBox="0 0 280 280" fill="none">
            <path d="M280 60 L220 60 L220 20 L140 20" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
            <path d="M280 140 L200 140 L200 90 L110 90" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
            <path d="M280 210 L240 210 L240 160 L170 160 L170 110" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
            <circle cx="220" cy="60" r="3.5" fill="#3B82F6"/>
            <circle cx="200" cy="140" r="3.5" fill="#06B6D4"/>
            <circle cx="140" cy="20" r="3.5" fill="#3B82F6"/>
          </svg>

          {/* Floating blob */}
          <div className="float-slow absolute top-8 left-12 w-24 h-16 pointer-events-none opacity-25 hidden lg:block page-hero-blob" />

          {/* Corner brackets */}
          <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-mono tracking-widest mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  FOR EMPLOYERS
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                  Hire Security Talent{" "}
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 terminal-badge terminal-badge-page"
                  >
                    10×
                    <span className="inline-block w-0.5 h-5 rounded-sm cursor-blink terminal-cursor" />
                  </span>{" "}
                  Faster
                </h1>

                <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-lg">
                  Stop sifting through 200 unqualified resumes. Cykruit's talent pool is exclusively cybersecurity professionals — every applicant actually understands your tech stack.
                </p>

                <div className="flex flex-col gap-3 mb-10">
                  {benefits.slice(0, 4).map((b) => (
                    <div key={b} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {b}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button href="/register" variant="primary" size="lg">
                    Post a Job Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button href="/login" variant="outline-light" size="lg">
                    Sign In
                  </Button>
                  <Button href="/register" variant="outline-light" size="lg">
                    Book a Demo
                  </Button>
                </div>
              </div>

              {/* Right — mock dashboard */}
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500/5 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <div className="flex items-center gap-1.5 ml-2">
                      <Terminal className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-mono text-slate-400 tracking-wider">employer.dashboard</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">Active Listings</p>
                      <span className="text-xs font-mono font-semibold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">3 Active</span>
                    </div>
                    {[
                      { title: "Senior Pentester", apps: 24, match: "92%", dot: "bg-green-500" },
                      { title: "Cloud Security Eng", apps: 18, match: "88%", dot: "bg-green-500" },
                      { title: "SOC Analyst II", apps: 41, match: "95%", dot: "bg-green-500" },
                    ].map((job) => (
                      <div key={job.title} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{job.title}</p>
                          <p className="text-xs font-mono text-slate-400">{job.apps} applicants</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${job.dot} animate-pulse`} />
                          <span className="text-xs font-mono font-semibold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">{job.match} match</span>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs font-mono text-blue-700">
                        AI: 3 top candidates match Senior Pentester above 90%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <div className="py-20 bg-white border-b border-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/40 to-transparent" />

          <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-blue-50 text-blue-600 border border-blue-100 mb-4 tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                PLATFORM FEATURES
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Everything You Need to Hire</h2>
              <p className="text-slate-500 max-w-xl mx-auto">Built specifically for the cybersecurity hiring workflow — not adapted from a generic template.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map(({ icon: Icon, title, desc, id, color, bg }) => (
                <div key={title} className="group relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-slate-200 group-hover:border-blue-300 transition-colors" />
                  <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-slate-200 group-hover:border-blue-300 transition-colors" />
                  <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-slate-200 group-hover:border-blue-300 transition-colors" />
                  <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-slate-200 group-hover:border-blue-300 transition-colors" />

                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl border-2 ${bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <span className="text-[9px] font-mono text-slate-300 tracking-widest">{id}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="py-20 bg-slate-50 border-b border-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/40 to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-cyan-50 text-cyan-600 border border-cyan-100 mb-4 tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                HOW IT WORKS
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">From Signup to First Interview in Days</h2>
              <p className="text-slate-500 max-w-xl mx-auto">No sales calls required. Verified and posting in under 10 minutes.</p>
            </div>

            <div className="relative">
              <div className="hidden lg:block absolute z-0 step-line-position">
                <svg width="100%" height="2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="stepLineEmp" x1="0" y1="0" x2="100%" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                      <stop offset="33%" stopColor="#06B6D4" stopOpacity="0.6" />
                      <stop offset="66%" stopColor="#A855F7" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="1" x2="100%" y2="1" stroke="url(#stepLineEmp)" strokeWidth="2" strokeDasharray="6 4" />
                </svg>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map(({ step, title, desc, code, color, bg }) => (
                  <div key={step} className="group relative flex flex-col gap-4">
                    <div className={`w-14 h-14 rounded-2xl border-2 ${bg} flex items-center justify-center relative z-10 shadow-sm group-hover:scale-105 transition-transform`}>
                      <span className={`text-lg font-bold font-mono ${color}`}>{step}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${color}`}>Step {step}</span>
                        <div className="inline-flex items-center px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                          <span className="text-[10px] font-mono text-green-400">{code}</span>
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Testimonials ── */}
        <div className="py-20 bg-white border-b border-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/40 to-transparent" />

          <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-blue-200 pointer-events-none" />
          <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-cyan-50 text-cyan-600 border border-cyan-100 mb-4 tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                EMPLOYER STORIES
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">What Hiring Teams Say</h2>
            </div>

            {testimonials.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-mono text-sm">
                Stories coming soon.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {testimonials.map((t) => (
                  <div key={t.id} className="group relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden flex flex-col gap-4">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500/70 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-slate-200 group-hover:border-blue-300 transition-colors" />
                    <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-slate-200 group-hover:border-blue-300 transition-colors" />
                    <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-slate-200 group-hover:border-blue-300 transition-colors" />
                    <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-slate-200 group-hover:border-blue-300 transition-colors" />

                    <div className="flex gap-1">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 group-hover:border-blue-100 transition-colors">
                      <div className={`w-9 h-9 rounded-full ${t.avatarColor ?? "bg-slate-600"} flex items-center justify-center shrink-0`}>
                        <span className="text-xs font-bold text-white">{t.avatar ?? t.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                        <p className="text-xs font-mono text-slate-400">{t.role} · {t.company}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="py-20 bg-bg-darkest relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-100 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-px bg-linear-to-r from-transparent via-blue-500/40 to-transparent" />

          <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 pointer-events-none" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 pointer-events-none" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-blue-500/30 pointer-events-none" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-blue-500/30 pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-7 shadow-xl shadow-blue-500/30">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-mono tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              START HIRING TODAY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
              Your Next Security Hire is Already on Cykruit
            </h2>
            <p className="text-slate-400 mb-10 leading-relaxed max-w-xl mx-auto">
              500+ verified companies trust Cykruit to find cybersecurity talent. Post your first role free and see AI-ranked candidates within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button href="/register" variant="primary" size="lg">
                Post a Job Free
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button href="/login" variant="secondary" size="lg">
                Sign In
              </Button>
              <Button href="/about" variant="secondary" size="lg">
                Learn More About Us
              </Button>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
