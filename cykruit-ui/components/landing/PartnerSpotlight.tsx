"use client";

// cykruit-ui/components/landing/PartnerSpotlight.tsx
// Showcase component rendered on the landing page immediately below the Hero section.
// Fetches active spotlight items for the given slotKey (e.g. landing-hero-strip).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { Sparkles, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";

interface SpotlightItem {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

const AUTOPLAY_INTERVAL_MS = 6000;

function SpotlightCard({ item }: { item: SpotlightItem }) {
  return (
    <Link
      href={`/spotlight/${item.id}`}
      className="group relative flex flex-col md:flex-row items-center gap-6 rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-blue-300 hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
      
      {/* Creative Media Preview */}
      <div className="relative w-full md:w-1/2 aspect-16/9 md:aspect-21/9 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
        <img
          src={item.imageUrl}
          alt={item.altText}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        
        <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-slate-900/80 text-white backdrop-blur-md shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Featured Partner</span>
        </span>
      </div>

      {/* Content & Action */}
      <div className="flex-1 flex flex-col justify-between w-full space-y-3">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full w-fit">
            <Sparkles className="w-3 h-3 text-blue-800" />
            <span>Industry Highlight</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-800 transition-colors line-clamp-2">
            {item.altText || "Featured Security Partner Initiative"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2">
            Click to explore exclusive partner insights, career paths, tools, and certifications.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="inline-flex items-center text-xs sm:text-sm font-bold text-blue-800 group-hover:text-blue-900 group-hover:translate-x-1 transition-all">
            <span>Explore Partner Showcase</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </span>

          <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-800 transition-colors">
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
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
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
    <section className="py-8 bg-slate-50/60 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-100/70 text-blue-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                Partner Spotlight
              </h2>
              <p className="text-xs text-slate-500">
                Featured initiatives, career updates, and enterprise security partners
              </p>
            </div>
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === selectedIndex ? "w-6 bg-blue-800" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Carousel or Single Item Display */}
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
