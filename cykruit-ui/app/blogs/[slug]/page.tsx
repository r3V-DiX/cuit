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
                className="w-full max-h-[480px] object-cover"
              />
            </div>
          )}

          {/* Article Main Body */}
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-5 prose-a:text-blue-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-code:font-mono prose-code:text-xs prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-4 prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/40 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-li:text-slate-700">
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

function formatContentToHtml(raw: string): string {
  if (!raw || !raw.trim()) return "";

  // If already full HTML formatted (contains block level html tags), return directly
  if (raw.includes("<p>") || raw.includes("<h2>") || raw.includes("<h3>") || raw.includes("<div>")) {
    return raw;
  }

  let html = raw;

  // 1. Code blocks: ```lang ... ```
  html = html.replace(/```([\w]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs my-4 overflow-x-auto"><code class="language-${lang || "text"}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // 2. Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

  // 3. Headers: #, ##, ###, ####
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-base font-bold text-slate-900 mt-5 mb-2">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-extrabold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold text-slate-900 mt-8 mb-4">$1</h1>');

  // 4. Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');

  // 5. Blockquotes: > quote
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-blue-600 bg-blue-50/50 py-2 px-4 rounded-r-lg text-slate-800 italic my-4">$1</blockquote>');

  // 6. Links & Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-4 max-w-full h-auto" />');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-semibold underline hover:text-blue-800">$1</a>');

  // 7. Bullet Lists & Numbered Lists
  html = html.replace(/^[\*\-] (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 my-1">$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-slate-700 my-1">$1</li>');

  // Wrap consecutive <li> tags inside <ul class="list-disc pl-5 my-4 space-y-1"> or <ol>
  html = html.replace(/(<li class="ml-4 list-disc text-slate-700 my-1">[\s\S]*?<\/li>\n?)+/g, '<ul class="list-disc pl-5 my-4 space-y-1">$&</ul>');
  html = html.replace(/(<li class="ml-4 list-decimal text-slate-700 my-1">[\s\S]*?<\/li>\n?)+/g, '<ol class="list-decimal pl-5 my-4 space-y-1">$&</ol>');

  // 8. Paragraphs
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<img")
      ) {
        return trimmed;
      }
      return `<p class="text-slate-700 leading-relaxed mb-4">${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
