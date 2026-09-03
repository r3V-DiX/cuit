// cykruit-ui/app/blogs/[slug]/page.tsx
// Public Dynamic Blog Article Reader Page with SEO & Social Sharing

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Shield,
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Share2,
  Check,
  ChevronRight,
  Terminal,
  Bookmark,
} from "lucide-react";
import ArticleContentRenderer from "./_components/article-renderer";
import AdSlot from "@/components/AdSlot";
import MarkdownIt from "markdown-it";

interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
  coverImage?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const PUBLIC_SERVICE_URL = process.env.PUBLIC_SERVICE_URL || "http://127.0.0.1:4006";

async function getBlogPost(slug: string): Promise<BlogPostDetail | null> {
  try {
    const res = await fetch(`${PUBLIC_SERVICE_URL}/public/blog/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? body;
  } catch {
    return null;
  }
}

function calculateReadTime(content?: string | null): number {
  if (!content) return 3;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) {
    return {
      title: "Article Not Found | Cykruit",
    };
  }

  const title = `${post.title} | Cykruit Security Insights`;
  const description =
    post.excerpt ||
    "Explore cybersecurity insights, threat intelligence, and technical guides on Cykruit.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.createdAt,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const readTime = calculateReadTime(post.content || post.excerpt);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-16">
        {/* ── Breadcrumb Header Bar ── */}
        <div className="border-b border-slate-100 bg-slate-50/70">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2 truncate">
              <Link href="/blogs" className="hover:text-blue-600 font-medium transition flex items-center space-x-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Articles</span>
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
              {post.category && (
                <>
                  <span className="text-slate-700 font-medium">{post.category}</span>
                  <ChevronRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
                </>
              )}
              <span className="text-slate-400 truncate">{post.title}</span>
            </div>
          </div>
        </div>

        {/* ── Article Header ── */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-6">
            {post.category && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <Tag className="h-3 w-3 text-blue-500" />
                <span>{post.category}</span>
              </span>
            )}
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{readTime} min read</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            {post.title}
          </h1>

          {/* Excerpt Lead */}
          {post.excerpt && (
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal mb-8 border-l-4 border-blue-600 pl-4 bg-slate-50/50 py-2 rounded-r-lg">
              {post.excerpt}
            </p>
          )}

          {/* Author Badge & Share Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200/80 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                  <span>Cykruit Security Research Team</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded border border-blue-200">
                    VERIFIED
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">Published in Cykruit Technical Dispatch</p>
              </div>
            </div>

            {/* Social Sharing Component */}
            <ArticleContentRenderer postTitle={post.title} slug={post.slug} />
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900">
              <img
                src={post.coverImage}
                alt={post.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[480px] object-cover"
              />
            </div>
          )}

          {/* Article Main Body */}
          <div className="markdown-rendered-content">
            {post.content ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: formatContentToHtml(post.content),
                }}
              />
            ) : (
              <p className="text-slate-500 italic">No additional content in this article.</p>
            )}
          </div>

          <div className="mt-10">
            <AdSlot slotKey="blog-article-end" />
          </div>

          {/* ── Author Footer Box ── */}
          <div className="mt-16 p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-md">
                <Shield className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">About Cykruit Dispatches</h4>
                <p className="text-xs text-slate-500 max-w-md mt-0.5 leading-relaxed">
                  Authored by security engineers, red teamers, and infosec leaders to keep the
                  cybersecurity community ahead of emerging threats and career opportunities.
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

  // If already wrapped in HTML structure from an external WYSIWYG editor
  if (raw.trim().startsWith("<article>") || raw.trim().startsWith("<div>")) {
    return raw;
  }

  try {
    return md.render(raw);
  } catch {
    return raw;
  }
}
