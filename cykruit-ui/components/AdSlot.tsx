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
      .then((res) => (res.ok ? res.json() : {}))
      .then((body) => (body && typeof body === "object" ? (body as AdsBySlot) : {}))
      .catch(() => ({}));
  }
  return adsPromise;
}

export default function AdSlot({ slotKey }: { slotKey: string }) {
  const [ad, setAd] = useState<AdCreative | null>(null);

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
      className="group relative flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/8 transition-all duration-200 overflow-hidden"
    >
      <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-slate-900/70 text-white backdrop-blur-sm">
        Sponsored
      </span>
      <img
        src={ad.imageUrl}
        alt={ad.altText}
        referrerPolicy="no-referrer"
        className="w-full h-full min-h-[160px] object-cover"
      />
    </a>
  );
}
