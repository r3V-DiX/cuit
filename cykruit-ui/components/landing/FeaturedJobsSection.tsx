import { MapPin, Clock, ArrowRight, Terminal, Shield, Lock, Bug, Wifi, Eye } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import JobCard from "@/components/ui/JobCard";

const ACCENT_POOL = [
  { accent: "bg-red-100 text-red-700", accentBorder: "group-hover:border-l-red-400", cyberIcon: Terminal },
  { accent: "bg-orange-100 text-orange-700", accentBorder: "group-hover:border-l-orange-400", cyberIcon: Wifi },
  { accent: "bg-blue-100 text-blue-700", accentBorder: "group-hover:border-l-blue-400", cyberIcon: Eye },
  { accent: "bg-indigo-100 text-indigo-700", accentBorder: "group-hover:border-l-indigo-400", cyberIcon: Bug },
  { accent: "bg-purple-100 text-purple-700", accentBorder: "group-hover:border-l-purple-400", cyberIcon: Lock },
  { accent: "bg-cyan-100 text-cyan-700", accentBorder: "group-hover:border-l-cyan-400", cyberIcon: Shield },
];

function postedAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export interface FeaturedJob {
  id: string;
  jobTitle: string;
  slug?: string;
  jobType?: string;
  workMode?: string;
  description?: string;
  publishedAt?: string;
  employer: {
    companyName: string;
    companyLogo?: string;
  };
  location?: {
    displayName?: string;
    city?: string;
    country?: string;
  } | null;
  skills?: { id: string; name: string }[];
  certifications?: { id: string; name: string; organization?: string }[];
}

function formatEnum(value: string): string {
  if (!value) return value;
  if (value === "SIZE_1000_PLUS") return "1000+";
  return value
    .replace(/SIZE_(\d+)_(\d+)/, "$1–$2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  jobs: FeaturedJob[];
}

export default function FeaturedJobsSection({ jobs }: Props) {
  return (
    <section className="py-16 bg-white border-t border-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/50 to-transparent" />
      <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
      <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-blue-200 pointer-events-none" />
      <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-blue-200 pointer-events-none" />
      <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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

        {jobs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-mono text-sm">
            No featured roles right now — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={{
                  ...job,
                  isFeatured: true,
                  posted: job.publishedAt ? postedAgo(job.publishedAt) : undefined,
                }}
                href={`/jobs/${job.slug ?? job.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
