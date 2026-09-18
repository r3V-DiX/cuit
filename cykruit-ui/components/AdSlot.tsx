"use client";

// cykruit-ui/components/AdSlot.tsx
// Renders an admin-managed ad for a given slot, or nothing if the slot has
// no active ad. Deliberately plain — no popup/overlay, just a card-shaped
// inline element that blends into the surrounding grid/content.

import { useEffect, useState } from "react";

interface AdCreative {
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

type AdsBySlot = Record<string, AdCreative>;

let adsPromise: Promise<AdsBySlot> | null = null;

function fetchAds(): Promise<AdsBySlot> {
  if (!adsPromise) {
    adsPromise = fetch("/api/public/ads")
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        const data = body?.success && body?.data !== undefined ? body.data : body;
        return data && typeof data === "object" ? (data as AdsBySlot) : {};
      })
      .catch(() => ({}));
  }
  return adsPromise;
}

export default function AdSlot({ slotKey }: { slotKey: string }) {
  const [ad, setAd] = useState<AdCreative | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAds().then((ads) => {
      if (!cancelled) setAd(ads[slotKey] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [slotKey]);

  if (!ad) return null;

  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener sponsored"
      className="group relative flex flex-col rounded-2xl bg-white border border-slate-200 border-l-2 border-l-slate-200 shadow-sm hover:border-blue-300 hover:border-l-blue-400 hover:shadow-md hover:shadow-blue-500/8 transition-all duration-200 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400/0 via-blue-500/60 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" />
      <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-slate-900/80 text-white backdrop-blur-sm">
        Featured Partner
      </span>
      <img
        src={ad.imageUrl}
        alt={ad.altText}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full min-h-[160px] object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </a>
  );
}
