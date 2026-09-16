"use client";

// cykruit-ui/components/AdCarousel.tsx
// Auto-sliding carousel of admin-managed ads for a slot with 2+ active ads.
// Falls back to a single static card (1 ad) or nothing (0 ads) — same
// silent-fallback pattern as AdSlot.tsx.

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface AdCreative {
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

const AUTOPLAY_INTERVAL_MS = 5000;

function AdCard({ ad }: { ad: AdCreative }) {
  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener sponsored"
      className="group relative flex flex-col rounded-2xl bg-white border border-slate-200 border-l-2 border-l-slate-200 shadow-sm hover:border-blue-300 hover:border-l-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500/60 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" />
      <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono uppercase tracking-wide bg-slate-900/70 text-white backdrop-blur-sm">
        Sponsored
      </span>
      <img
        src={ad.imageUrl}
        alt={ad.altText}
        referrerPolicy="no-referrer"
        className="w-full h-full min-h-[180px] object-cover"
      />
    </a>
  );
}

export default function AdCarousel({ slotKey }: { slotKey: string }) {
  const [ads, setAds] = useState<AdCreative[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/ads/${slotKey}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        const data = body?.success && body?.data !== undefined ? body.data : body;
        if (!cancelled) setAds(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setAds([]);
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
    if (!emblaApi || ads.length < 2 || isHovered) return;
    const id = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [emblaApi, ads.length, isHovered]);

  if (ads.length === 0) return null;

  if (ads.length === 1) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdCard ad={ads[0]} />
      </div>
    );
  }

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {ads.map((ad, i) => (
            <div className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-2" key={i}>
              <AdCard ad={ad} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-4">
        {ads.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to ad ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === selectedIndex ? "w-6 bg-blue-500" : "w-1.5 bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
