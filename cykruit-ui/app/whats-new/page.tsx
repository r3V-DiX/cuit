"use client";

// cykruit-ui/app/whats-new/page.tsx
// Public Events, Seminars & Announcements Directory — mirrors app/blogs/page.tsx.

import { useState, useEffect, useCallback, Suspense, Fragment } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdSlot from "@/components/AdSlot";
import {
  Calendar,
  Search,
  MapPin,
  Tag,
  ArrowRight,
  Shield,
  Loader2,
} from "lucide-react";

interface PublicEventItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  location?: string | null;
  eventDate: string;
  bannerImage?: string | null;
}

interface PublicEventsResponse {
  data: PublicEventItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function EventsContent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<PublicEventItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "9");

      const res = await fetch(`/api/public/events?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const payload = json?.success && json?.data !== undefined ? json.data : json;
        const items: PublicEventItem[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        setEvents(items);
        setTotalPages(payload?.totalPages ?? 1);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = events.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.title.toLowerCase().includes(term) ||
      e.description?.toLowerCase().includes(term) ||
      e.category?.toLowerCase().includes(term) ||
      e.location?.toLowerCase().includes(term)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50 pt-16">
      {/* ── Hero Header ── */}
      <div className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-grid-md opacity-40" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-mono tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            WHAT&apos;S NEW
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
            Events, Seminars &{" "}
            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-0.5 relative terminal-badge terminal-badge-page text-blue-600 bg-blue-50 border border-blue-100">
              Announcements
            </span>
          </h1>

          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Cybersecurity workshops, CTFs, webinars, and platform announcements from
            the Cykruit community.
          </p>

          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search events by title, category, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* ── Events Section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Fetching events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No events found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {searchTerm
                ? "No matching events found for your search."
                : "Nothing scheduled yet. Check back soon."}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            <AdSlot slotKey="whats-new-banner" />

            {/* Grid of Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, i) => (
                <Fragment key={event.id}>
                <Link
                  href={`/whats-new/${event.slug}`}
                  className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden"
                >
                  {/* Banner */}
                  <div className="h-48 w-full bg-slate-900 relative overflow-hidden shrink-0">
                    {event.bannerImage ? (
                      <img
                        src={event.bannerImage}
                        alt={event.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-400">
                        <Calendar className="h-12 w-12 opacity-30" />
                      </div>
                    )}
                    {event.category && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs border border-white/60">
                          {event.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.eventDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {event.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                      <span>Learn More</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
                {(i + 1) % 6 === 0 && <AdSlot slotKey="whats-new-grid" />}
                </Fragment>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-6">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <span className="text-xs font-mono text-slate-500 px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function WhatsNewPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-slate-50 pt-20 text-center text-sm text-slate-400">Loading...</div>}>
        <EventsContent />
      </Suspense>
      <Footer />
    </>
  );
}
