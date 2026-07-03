import { MapPin, Clock, ArrowRight, Terminal, Shield, Lock, Bug, Wifi, Eye } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

const jobs = [
  {
    id: 1,
    title: "Senior Penetration Tester",
    company: "CrowdStrike",
    location: "Remote • US",
    type: "Full-time",
    tags: ["Red Team", "Web App", "OSCP"],
    posted: "2d ago",
    logo: "CS",
    accent: "bg-red-100 text-red-700",
    cyberIcon: Terminal,
    accentBorder: "group-hover:border-l-red-400",
  },
  {
    id: 2,
    title: "Cloud Security Engineer",
    company: "Palo Alto Networks",
    location: "Santa Clara, CA",
    type: "Full-time",
    tags: ["AWS", "Zero Trust", "CSPM"],
    posted: "1d ago",
    logo: "PA",
    accent: "bg-orange-100 text-orange-700",
    cyberIcon: Wifi,
    accentBorder: "group-hover:border-l-orange-400",
  },
  {
    id: 3,
    title: "SOC Analyst — Tier 2",
    company: "Mandiant",
    location: "Remote • Global",
    type: "Full-time",
    tags: ["SIEM", "Threat Hunt", "DFIR"],
    posted: "3h ago",
    logo: "MD",
    accent: "bg-blue-100 text-blue-700",
    cyberIcon: Eye,
    accentBorder: "group-hover:border-l-blue-400",
  },
  {
    id: 4,
    title: "AppSec Engineer",
    company: "Stripe",
    location: "San Francisco, CA",
    type: "Full-time",
    tags: ["SAST", "Code Review", "Bug Bounty"],
    posted: "5d ago",
    logo: "ST",
    accent: "bg-indigo-100 text-indigo-700",
    cyberIcon: Bug,
    accentBorder: "group-hover:border-l-indigo-400",
  },
  {
    id: 5,
    title: "Malware Analyst",
    company: "Recorded Future",
    location: "Remote • US",
    type: "Contract",
    tags: ["Reverse Engineering", "IDA Pro", "Threat Intel"],
    posted: "1w ago",
    logo: "RF",
    accent: "bg-purple-100 text-purple-700",
    cyberIcon: Lock,
    accentBorder: "group-hover:border-l-purple-400",
  },
  {
    id: 6,
    title: "Identity Security Architect",
    company: "Okta",
    location: "Remote • Global",
    type: "Full-time",
    tags: ["IAM", "Zero Trust", "OAuth"],
    posted: "2d ago",
    logo: "OK",
    accent: "bg-cyan-100 text-cyan-700",
    cyberIcon: Shield,
    accentBorder: "group-hover:border-l-cyan-400",
  },
];

export default function FeaturedJobsSection() {
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-blue-50 text-blue-600 border border-blue-100 mb-3 tracking-widest">
              <Shield className="w-3 h-3" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              FEATURED ROLES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Top Jobs Right Now
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Hand-picked from top security companies
            </p>
          </div>
          <Button href="/jobs" variant="outline-light" size="sm">
            View all jobs
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const CyberIcon = job.cyberIcon;
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className={`
                  group relative flex flex-col gap-4 p-5 rounded-2xl bg-white
                  border border-slate-200 border-l-2 border-l-slate-200
                  shadow-sm hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/8
                  transition-all duration-200 overflow-hidden
                  ${job.accentBorder}
                `}
              >
                {/* Top accent bar on hover */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500/60 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                {/* Cyber icon watermark top-right */}
                <CyberIcon className="absolute top-4 right-4 w-5 h-5 text-slate-100 group-hover:text-blue-100 transition-colors" />

                {/* Company header */}
                <div className="flex items-center gap-3 pr-6">
                  <div className={`w-10 h-10 rounded-xl ${job.accent} flex items-center justify-center shrink-0 font-bold text-xs font-mono`}>
                    {job.logo}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium font-mono">{job.company}</p>
                    <h3 className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {job.type}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600 bg-slate-100 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">{job.posted}</span>
                  <span className="text-[11px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-mono">
                    View role <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
