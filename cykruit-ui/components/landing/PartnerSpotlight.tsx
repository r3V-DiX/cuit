"use client";

// cykruit-ui/components/landing/PartnerSpotlight.tsx
// High-Impact Spotlight Showcase for Flagship Cybersecurity Events & Initiatives.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Flame,
  ChevronLeft,
  ChevronRight,
  Zap,
  Award,
  Terminal,
  Users,
} from "lucide-react";

interface SpotlightItem {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

const AUTOPLAY_INTERVAL_MS = 6000;

function SpotlightCard({ item }: { item: SpotlightItem }) {
  // Extract date string from title if present inside parentheses, e.g. (Sept 28 - Oct 1, 2026)
  const dateMatch = item.altText.match(/\(([^)]+)\)/);
  const eventDate = dateMatch ? dateMatch[1] : null;

  // Split title and subtitle by "—" or "-" if provided in Admin Panel altText
  const textWithoutDate = item.altText.replace(/\([^)]+\)/, "").trim();
  const parts = textWithoutDate.split("—");
  const eventTitle = parts[0]?.trim() || textWithoutDate;
  const eventSubtitle =
    parts[1]?.trim() ||
    "Join thousands of cybersecurity leaders, threat analysts, and security engineers. Explore live technical briefings, zero-day exploitation labs, CISO keynotes, and hands-on CTF defense arenas.";

  return (
    <Link
      href={`/spotlight/${item.id}`}
      className="group relative flex flex-col lg:flex-row items-stretch gap-8 rounded-3xl bg-gradient-to-br from-blue-50/50 via-white to-sky-50/40 backdrop-blur-xl border border-blue-200/80 p-6 sm:p-8 shadow-xl shadow-blue-950/5 hover:bg-blue-50/80 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300 overflow-hidden"
    >
      {/* Signature Blue Gradient Highlight Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300 z-20" />

      {/* Media Preview — Increased Height & Scale FX */}
      <div className="relative w-full lg:w-3/5 min-h-[280px] sm:min-h-[340px] lg:min-h-[380px] rounded-2xl overflow-hidden bg-slate-950 shrink-0 shadow-md">
        <img
          src={item.imageUrl}
          alt={item.altText}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-85 group-hover:opacity-70 transition-opacity" />

        {/* Floating Top Badges */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide bg-slate-950/85 text-white border border-white/20 backdrop-blur-md shadow-md">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Featured Summit</span>
          </span>

          {eventDate && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600/90 text-white backdrop-blur-md shadow-md border border-blue-400/30">
              <Calendar className="w-3.5 h-3.5 text-blue-200" />
              <span>{eventDate}</span>
            </span>
          )}
        </div>

        {/* Live Status Indicator */}
        <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 backdrop-blur-md shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Registration Open</span>
        </div>
      </div>

      {/* Content Details — Right Side Rich Fill */}
      <div className="flex-1 flex flex-col justify-between w-full space-y-6 py-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-900 bg-blue-100/90 border border-blue-300 px-3 py-1 rounded-full shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>Flagship Industry Event</span>
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              <Zap className="w-3 h-3 text-indigo-600" />
              <span>Spotlight</span>
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-800 transition-colors">
            {eventTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {eventSubtitle}
          </p>

          {/* Quick Feature Badges on Right Side */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white/90 border border-blue-200 px-3 py-1 rounded-xl shadow-2xs">
              <Users className="w-3.5 h-3.5 text-blue-700" />
              <span>CISO Keynotes & Briefings</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white/90 border border-blue-200 px-3 py-1 rounded-xl shadow-2xs">
              <Terminal className="w-3.5 h-3.5 text-indigo-700" />
              <span>Zero-Day Exploitation Arena</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white/90 border border-blue-200 px-3 py-1 rounded-xl shadow-2xs">
              <Award className="w-3.5 h-3.5 text-emerald-700" />
              <span>24 CPE Credits</span>
            </span>
          </div>
        </div>

        {/* Action Button Card */}
        <div className="pt-4 border-t border-blue-200/80 flex items-center justify-between gap-4">
          <span className="inline-flex items-center text-sm sm:text-base font-extrabold text-blue-900 group-hover:text-blue-800 transition-colors">
            <span>Explore Event Showcase & Details</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300 text-blue-700" />
          </span>

          <div className="p-3.5 rounded-2xl bg-white border border-blue-200 text-blue-800 group-hover:bg-blue-800 group-hover:text-white group-hover:border-blue-800 shadow-sm transition-all duration-300 shrink-0">
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PartnerSpotlight({ slotKey = "landing-hero-strip" }: { slotKey?: string }) {
  const [items, setItems] = useState<SpotlightItem[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/ads/${slotKey}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        const data = body?.success && body?.data !== undefined ? body.data : body;
        if (!cancelled) {
          const list = Array.isArray(data) ? data.slice(0, 2) : [];
          setItems(list);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slotKey]);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || items.length < 2 || isHovered) return;
    const id = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [emblaApi, items.length, isHovered]);

  if (items.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-blue-50/60 via-slate-50/70 to-white border-y border-blue-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-blue-200/70 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-800 text-white shadow-md shadow-blue-900/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                  Featured Partner Spotlight
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100/90 text-blue-900 border border-blue-200">
                  Flagship Summits & Conferences
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                Premier cybersecurity conferences, global summits, and technical defense arenas
              </p>
            </div>
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                className="p-2 rounded-xl border border-blue-200 bg-white text-blue-900 hover:bg-blue-50 hover:border-blue-300 transition shadow-2xs"
                aria-label="Previous event"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === selectedIndex ? "w-8 bg-blue-800" : "w-2.5 bg-blue-200 hover:bg-blue-300"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                className="p-2 rounded-xl border border-blue-200 bg-white text-blue-900 hover:bg-blue-50 hover:border-blue-300 transition shadow-2xs"
                aria-label="Next event"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Display Container */}
        {items.length === 1 ? (
          <SpotlightCard item={items[0]} />
        ) : (
          <div
            className="overflow-hidden"
            ref={emblaRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex gap-6">
              {items.map((item) => (
                <div className="flex-[0_0_100%] min-w-0" key={item.id}>
                  <SpotlightCard item={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
