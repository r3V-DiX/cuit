// cykruit-ui/app/whats-new/[slug]/page.tsx
// Public Dynamic Event/Seminar/Announcement Reader Page — mirrors app/blogs/[slug]/page.tsx.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Calendar,
  ArrowLeft,
  MapPin,
  Tag,
  ChevronRight,
} from "lucide-react";
import AdSlot from "@/components/AdSlot";
import MarkdownIt from "markdown-it";

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  content?: string | null;
  category?: string | null;
  location?: string | null;
  eventDate: string;
  bannerImage?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const PUBLIC_SERVICE_URL = process.env.PUBLIC_SERVICE_URL || "http://127.0.0.1:4006";

async function getEvent(slug: string): Promise<EventDetail | null> {
  try {
    const res = await fetch(`${PUBLIC_SERVICE_URL}/public/events/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? body;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) {
    return { title: "Event Not Found | Cykruit" };
  }

  const title = `${event.title} | Cykruit What's New`;
  const description =
    event.description || "Cybersecurity events, seminars, and announcements from Cykruit.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: event.bannerImage ? [{ url: event.bannerImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: event.bannerImage ? [event.bannerImage] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-16">
        {/* ── Breadcrumb Header Bar ── */}
        <div className="border-b border-slate-100 bg-slate-50/70">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2 truncate">
              <Link href="/whats-new" className="hover:text-blue-600 font-medium transition flex items-center space-x-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>What&apos;s New</span>
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
              {event.category && (
                <>
                  <span className="text-slate-700 font-medium">{event.category}</span>
                  <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                </>
              )}
              <span className="text-slate-400 truncate">{event.title}</span>
            </div>
          </div>
        </div>

        {/* ── Event Header ── */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-6">
            {event.category && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <Tag className="h-3 w-3 text-blue-500" />
                <span>{event.category}</span>
              </span>
            )}
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {new Date(event.eventDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </span>
            {event.location && (
              <>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{event.location}</span>
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            {event.title}
          </h1>

          {/* Description Lead */}
          {event.description && (
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal mb-8 border-l-4 border-blue-600 pl-4 bg-slate-50/50 py-2 rounded-r-lg">
              {event.description}
            </p>
          )}

          {/* Banner Image */}
          {event.bannerImage && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900">
              <img
                src={event.bannerImage}
                alt={event.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[480px] object-cover"
              />
            </div>
          )}

          {/* Event Main Body */}
          <div className="markdown-rendered-content">
            {event.content ? (
              <div dangerouslySetInnerHTML={{ __html: formatContentToHtml(event.content) }} />
            ) : (
              <p className="text-slate-500 italic">No additional details for this event.</p>
            )}
          </div>

          <div className="mt-10">
            <AdSlot slotKey="whats-new-article-end" />
          </div>

          {/* ── Footer Box ── */}
          <div className="mt-16 p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-md">
                <Calendar className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">More from Cykruit</h4>
                <p className="text-xs text-slate-500 max-w-md mt-0.5 leading-relaxed">
                  Explore open cybersecurity roles or catch up on our latest research and guides.
                </p>
              </div>
            </div>

            <Link
              href="/jobs"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
            >
              <span>Explore Security Roles</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

const defaultImageRule =
  md.renderer.rules.image ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const srcIndex = token.attrIndex("src");
  const rawSrc = srcIndex >= 0 && token.attrs ? token.attrs[srcIndex][1] : "";
  const src = typeof rawSrc === "string" ? rawSrc : String(rawSrc || "");

  const isPlaceholder = !src || src.startsWith("IMAGE_URL") || src === "#";
  if (isPlaceholder) {
    return `<div class="my-5 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5"><span class="font-medium text-slate-700">🖼 Image: ${token.content || "Illustration"}</span></div>`;
  }

  token.attrPush(["loading", "lazy"]);
  token.attrPush(["referrerpolicy", "no-referrer"]);
  token.attrPush(["class", "rounded-xl border border-slate-200 shadow-xs my-6 max-w-full h-auto mx-auto"]);
  return defaultImageRule(tokens, idx, options, env, self);
};

const defaultLinkRule =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  token.attrPush(["target", "_blank"]);
  token.attrPush(["rel", "noopener noreferrer"]);
  token.attrPush(["class", "text-blue-600 font-semibold underline hover:text-blue-800"]);
  return defaultLinkRule(tokens, idx, options, env, self);
};

function formatContentToHtml(raw: string): string {
  if (!raw || !raw.trim()) return "";
  if (raw.trim().startsWith("<article>") || raw.trim().startsWith("<div>")) {
    return raw;
  }
  try {
    return md.render(raw);
  } catch {
    return raw;
  }
}
