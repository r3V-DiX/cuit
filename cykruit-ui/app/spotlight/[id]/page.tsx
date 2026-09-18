"use client";

// cykruit-ui/app/spotlight/[id]/page.tsx
// Comprehensive Full-Length Showcase Page for Featured Cybersecurity Events & Partner Initiatives.

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Share2,
  Building2,
  Globe,
  Calendar,
  MapPin,
  Users,
  Award,
  Zap,
  Terminal,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface SpotlightDetail {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  slotKey?: string;
}

export default function SpotlightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<SpotlightDetail | null>(null);
  const [otherSpotlights, setOtherSpotlights] = useState<SpotlightDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/public/ads/detail/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled) return;
        const data = body?.success && body?.data !== undefined ? body.data : body;
        if (data?.linkUrl) {
          setItem(data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Fetch other active spotlights for the bottom grid
    fetch(`/api/public/ads/landing-hero-strip`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled) return;
        const list = body?.success && Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        setOtherSpotlights(list.filter((x: SpotlightDetail) => x.id !== id));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Parse title, dates, and subtitle from altText
  const dateMatch = item?.altText.match(/\(([^)]+)\)/);
  const eventDate = dateMatch ? dateMatch[1] : "Sep & Oct 2026 Flagship Event";
  const textWithoutDate = item?.altText.replace(/\([^)]+\)/, "").trim() || "";
  const parts = textWithoutDate.split("—");
  const eventTitle = parts[0]?.trim() || textWithoutDate || "Featured Cybersecurity Summit";
  const eventSubtitle =
    parts[1]?.trim() ||
    "Join thousands of cybersecurity leaders, threat analysts, and security engineers for keynote summits, zero-day exploitation labs, CISO panels, and technical briefings.";

  return (
    <>
      <Navbar />

      {/* Light Blue Glassmorphic Top Navigation Sub-Bar */}
      <div className="sticky top-0 z-40 bg-sky-50/95 backdrop-blur-md text-slate-800 border-b border-blue-200/80 shadow-xs py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 hover:scale-[1.02] transition-all cursor-pointer border border-blue-500 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white stroke-[3]" />
            <span>Back to Cykruit Home</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 font-medium truncate">
            <Link href="/" className="hover:text-blue-700 transition">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-blue-800 font-semibold">Partner Spotlight</span>
            <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-900 font-bold truncate max-w-xs">{eventTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-xs font-bold text-blue-900 transition-all shrink-0 shadow-2xs"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Share Showcase</span>
                </>
              )}
            </button>

            {item?.linkUrl && (
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all shrink-0"
              >
                <span>Register</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </a>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 bg-gradient-to-b from-blue-50/60 via-slate-50 to-white py-8 sm:py-12 min-h-[80vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/80 backdrop-blur-md rounded-3xl border border-blue-200/80 shadow-md space-y-4 text-slate-500">
              <div className="w-10 h-10 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Loading showcase details…</p>
            </div>
          ) : notFound || !item ? (
            <div className="text-center py-24 px-6 bg-white rounded-3xl border border-blue-200 shadow-md space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Building2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Showcase Spotlight Not Found</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                This partner spotlight campaign is no longer active or the link has expired.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Cykruit Home</span>
              </Link>
            </div>
          ) : (
            <article className="space-y-8">
              
              {/* Main Card Container */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-blue-200/90 shadow-xl overflow-hidden divide-y divide-blue-100">
                
                {/* 1. Hero Cover Header */}
                <div className="relative aspect-21/9 min-h-[320px] sm:min-h-[420px] w-full bg-slate-950 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.altText}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-85" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex flex-wrap items-center justify-between gap-3 text-white z-10">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-900/90 backdrop-blur-md text-white border border-blue-300/30 shadow-md">
                      <ShieldCheck className="w-4 h-4 text-cyan-300" />
                      <span>Official Partner Spotlight</span>
                    </span>

                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600/95 backdrop-blur-md text-white shadow-md">
                      <Calendar className="w-4 h-4 text-blue-100" />
                      <span>{eventDate}</span>
                    </span>
                  </div>

                  {/* Hero Bottom Information Title Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 space-y-3 z-10 text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Registration Open</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                      {eventTitle}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200 font-medium">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-cyan-300" />
                        <span>Hybrid (In-Person & Online Global Stream)</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-300" />
                        <span>4,000+ Attending Security Professionals</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Primary Showcase Body & Intro */}
                <div className="p-6 sm:p-10 space-y-8 bg-gradient-to-b from-white via-blue-50/30 to-slate-50/50">
                  
                  {/* Tag & Subtitle */}
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-900 bg-blue-100/90 border border-blue-200 px-3.5 py-1 rounded-full">
                      <Sparkles className="w-4 h-4 text-blue-800" />
                      <span>Executive Overview & Keynote Track</span>
                    </div>

                    <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-semibold max-w-4xl">
                      {eventSubtitle}
                    </p>

                    <p className="text-sm text-slate-600 leading-relaxed max-w-4xl font-normal">
                      Cykruit is proud to showcase this flagship industry event. Designed for CISOs, Security Engineers, SOC Analysts, and Penetration Testers, this event features technical deep-dives into modern threat vectors, cloud infrastructure security, and offensive defense strategies.
                    </p>
                  </div>

                  {/* 3. Key Highlights Grid (4 Cards) */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-700" />
                      <span>Event Highlights & What To Expect</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-2xs space-y-2">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 w-fit">
                          <Users className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">CISO Keynote Panels</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Hear strategic keynotes from Fortune 500 security leaders and cloud architects.
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-2xs space-y-2">
                        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 w-fit">
                          <Terminal className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Zero-Day Exploitation Arena</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Live offensive hacking workshops, reverse engineering labs, and CTF competitions.
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-2xs space-y-2">
                        <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 w-fit">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">AI & Cloud Threat Briefings</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Deep-dives into LLM security vulnerabilities, Kubernetes hardening & SOC automation.
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-2xs space-y-2">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 w-fit">
                          <Award className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">Earn CPE Credits</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Earn up to 24 CPE credits recognized by ISC2 CISSP, ISACA, and GIAC programs.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* 4. Agenda & Learning Tracks */}
                  <div className="space-y-4 pt-4 border-t border-blue-100">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-700" />
                      <span>Flagship Learning Tracks</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                        <span className="text-[11px] font-bold uppercase font-mono text-blue-800">Track 01</span>
                        <h4 className="text-sm font-bold text-slate-900">Cloud & Container Defense</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Zero-Trust microsegmentation, IAM governance, AWS/Azure security posture management.
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
                        <span className="text-[11px] font-bold uppercase font-mono text-indigo-800">Track 02</span>
                        <h4 className="text-sm font-bold text-slate-900">Offensive Security & Red Teaming</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Active Directory exploitation, EDR evasion techniques, kernel-level malware analysis.
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-2">
                        <span className="text-[11px] font-bold uppercase font-mono text-sky-800">Track 03</span>
                        <h4 className="text-sm font-bold text-slate-900">AI-Powered SOC Operations</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Autonomous threat hunting, SOAR playbook automation, real-time incident triage.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* 5. Primary Action Card — Vibrant Light Blue Gradient */}
                  <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 text-white p-6 sm:p-8 shadow-xl shadow-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/30">
                        <Globe className="w-3.5 h-3.5 text-cyan-200" />
                        <span>Official Partner Event Registration</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                        Reserve Your Pass For {eventTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                        Click below to access the official event website, view full speaker schedules, and complete your registration.
                      </p>
                    </div>

                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white hover:bg-blue-50 text-blue-900 font-black text-sm shadow-lg shadow-black/10 hover:scale-[1.02] transition-all shrink-0 cursor-pointer"
                    >
                      <span>Register & Visit Partner Site</span>
                      <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                    </a>
                  </div>

                </div>
              </div>

              {/* 6. Other Active Industry Spotlights */}
              {otherSpotlights.length > 0 && (
                <div className="space-y-4 pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-blue-700" />
                      <span>Other Featured Industry Spotlights</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherSpotlights.map((spot) => (
                      <Link
                        key={spot.id}
                        href={`/spotlight/${spot.id}`}
                        className="group bg-white rounded-2xl border border-blue-200/80 p-4 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-4 overflow-hidden"
                      >
                        <img
                          src={spot.imageUrl}
                          alt={spot.altText}
                          referrerPolicy="no-referrer"
                          className="w-24 h-20 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                            Partner Showcase
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                            {spot.altText}
                          </h4>
                          <span className="inline-flex items-center text-xs font-bold text-blue-600 pt-0.5">
                            View details <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
