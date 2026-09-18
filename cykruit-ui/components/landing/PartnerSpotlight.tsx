"use client";

// cykruit-ui/components/landing/PartnerSpotlight.tsx
// Ultra-attractive Spotlight Showcase for Flagship Cybersecurity Events (Sep/Oct 2026).

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
} from "lucide-react";

interface SpotlightItem {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

const AUTOPLAY_INTERVAL_MS = 6000;

function SpotlightCard({ item }: { item: SpotlightItem }) {
  // Extract date string from title if present, e.g. (Sept 28 - Oct 1, 2026)
  const dateMatch = item.altText.match(/\(([^)]+)\)/);
  const eventDate = dateMatch ? dateMatch[1] : null;
  const eventTitle = item.altText.replace(/\([^)]+\)/, "").trim();

  return (
    <Link
      href={`/spotlight/${item.id}`}
      className="group relative flex flex-col lg:flex-row items-stretch gap-6 rounded-3xl bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border border-slate-200/90 p-5 sm:p-7 shadow-md hover:shadow-2xl hover:border-blue-400 hover:shadow-blue-500/12 transition-all duration-300 overflow-hidden"
    >
      {/* Top Gradient Highlight Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300 z-20" />

      {/* Creative Media Preview */}
      <div className="relative w-full lg:w-3/5 aspect-16/9 lg:aspect-21/9 rounded-2xl overflow-hidden bg-slate-950 shrink-0 shadow-inner">
        <img
          src={item.imageUrl}
          alt={item.altText}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

        {/* Floating Top Badges */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-slate-950/85 text-white border border-white/15 backdrop-blur-md shadow-md">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Featured Summit</span>
          </span>

          {eventDate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/90 text-white backdrop-blur-md shadow-md">
              <Calendar className="w-3.5 h-3.5 text-blue-200" />
              <span>{eventDate}</span>
            </span>
          )}
        </div>

        {/* Live Status Indicator */}
        <div className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Registration Open</span>
        </div>
      </div>

      {/* Content Details */}
      <div className="flex-1 flex flex-col justify-between w-full space-y-4 py-1">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-100/80 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
              <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
              <span>Sep / Oct 2026 Highlight</span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug group-hover:text-blue-800 transition-colors">
            {eventTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 font-medium">
            Join thousands of cybersecurity leaders, threat analysts, and security engineers. Explore live technical briefings, zero-day exploitation labs, and keynote summits.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
          <span className="inline-flex items-center text-xs sm:text-sm font-extrabold text-blue-800 group-hover:text-blue-900 transition-colors">
            <span>View Event & Register Showcase</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
          </span>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-2xs transition-all duration-300">
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
          // Keep top 2 items for maximum impact
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
    <section className="py-8 sm:py-10 bg-gradient-to-b from-slate-100/70 via-slate-50 to-white border-y border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-800 text-white shadow-md shadow-blue-900/15">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                  Featured Partner Spotlight
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                  Sep & Oct 2026 Flagship Summits
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Premier cybersecurity conferences, global summits, and technical defense arenas
              </p>
            </div>
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
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
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === selectedIndex ? "w-7 bg-blue-800" : "w-2 bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
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
            <div className="flex gap-4">
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
