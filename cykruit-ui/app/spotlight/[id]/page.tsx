"use client";

// cykruit-ui/app/spotlight/[id]/page.tsx
// Dedicated Showcase Detail Page for clicked Partner Spotlight items.

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

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50/50 py-8 sm:py-12 min-h-[75vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>Back to Cykruit Home</span>
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs transition"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share Showcase</span>
                </>
              )}
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <p className="text-xs font-medium">Loading partner showcase details…</p>
            </div>
          ) : notFound || !item ? (
            <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Showcase Spotlight Not Found</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This partner spotlight campaign is no longer active or the link has expired.
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Return to Cykruit Home
              </Link>
            </div>
          ) : (
            <article className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
              {/* Top Banner Feature */}
              <div className="relative aspect-21/9 w-full bg-slate-900 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.altText}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-wrap items-center justify-between gap-3 text-white">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Featured Partner Spotlight</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>Verified Industry Partner</span>
                  </span>
                </div>
              </div>

              {/* Detail Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                    <span>Partner Initiative Showcase</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {item.altText || "Featured Security Partner Showcase"}
                  </h1>

                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    This initiative is presented in official collaboration with our featured industry partner. Click below to explore full details, available positions, certifications, or specialized cybersecurity tools on the partner's platform.
                  </p>
                </div>

                {/* Primary Action Card */}
                <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 border border-blue-200/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs font-bold text-slate-800 block">
                      Ready to learn more about this initiative?
                    </span>
                    <span className="text-xs text-slate-500 block truncate max-w-md font-mono">
                      {item.linkUrl}
                    </span>
                  </div>

                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm shadow-md shadow-blue-900/15 hover:shadow-lg transition-all shrink-0"
                  >
                    <span>Visit Partner Webpage</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
