import { MapPin, Clock, ArrowRight, Terminal, Shield, Lock, Bug, Wifi, Eye } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

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
            {jobs.map((job, i) => {
              const style = ACCENT_POOL[i % ACCENT_POOL.length];
              const CyberIcon = style.cyberIcon;
              const tags = [
                ...(job.skills?.slice(0, 2).map((s) => s.name) ?? []),
                ...(job.certifications?.slice(0, 1).map((c) => c.name) ?? []),
              ].slice(0, 3);
              const locationLabel = [
                job.workMode ? formatEnum(job.workMode) : null,
                job.location?.displayName ?? job.location?.city,
              ]
                .filter(Boolean)
                .join(" • ");

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.slug ?? job.id}`}
                  className={`
                    group relative flex flex-col gap-4 p-5 rounded-2xl bg-white
                    border border-slate-200 border-l-2 border-l-slate-200
                    shadow-sm hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/8
                    transition-all duration-200 overflow-hidden
                    ${style.accentBorder}
                  `}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500/60 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <CyberIcon className="absolute top-4 right-4 w-5 h-5 text-slate-100 group-hover:text-blue-100 transition-colors" />

                  <div className="flex items-center gap-3 pr-6">
                    <div className={`w-10 h-10 rounded-xl ${style.accent} flex items-center justify-center shrink-0 font-bold text-xs font-mono`}>
                      {initials(job.employer.companyName)}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium font-mono">{job.employer.companyName}</p>
                      <h3 className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                        {job.jobTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {locationLabel && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {locationLabel}
                      </span>
                    )}
                    {job.jobType && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatEnum(job.jobType)}
                      </span>
                    )}
                  </div>

                  {job.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600 bg-slate-100 rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-mono">{job.publishedAt ? postedAgo(job.publishedAt) : ""}</span>
                    <span className="text-[11px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-mono">
                      View role <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
