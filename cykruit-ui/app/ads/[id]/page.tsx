"use client";

// cykruit-ui/app/ads/[id]/page.tsx
// Interstitial page an ad click lands on before leaving the site — shows the
// sponsor creative briefly, then redirects to the advertiser's real linkUrl.

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface AdDetail {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

const REDIRECT_DELAY_MS = 2000;

export default function AdRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/ads/detail/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled) return;
        const data = body?.success && body?.data !== undefined ? body.data : body;
        if (data?.linkUrl) {
          setAd(data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!ad) return;
    const timer = setTimeout(() => {
      window.location.href = ad.linkUrl;
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ad]);

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-600">This ad is no longer available.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Cykruit
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      {ad && (
        <img
          src={ad.imageUrl}
          alt={ad.altText}
          referrerPolicy="no-referrer"
          className="max-w-md w-full rounded-2xl border border-slate-200 shadow-sm object-cover"
        />
      )}
      <div className="flex flex-col items-center gap-2">
        <p className="text-slate-600">Taking you to the sponsor…</p>
        {ad && (
          <a href={ad.linkUrl} className="text-sm font-medium text-blue-600 hover:underline">
            Continue now
          </a>
        )}
        <Link href="/" className="text-xs text-slate-400 hover:underline">
          Back to Cykruit
        </Link>
      </div>
    </div>
  );
}
