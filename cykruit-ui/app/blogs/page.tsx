"use client";

// cykruit-ui/app/blogs/page.tsx
// Public Cybersecurity Blog Catalog & Insights Directory

import { useState, useEffect, useCallback, Suspense, Fragment } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdSlot from "@/components/AdSlot";
import { getGridAdPositions } from "@/lib/ad-placement";
import {
  BookOpen,
  Search,
  Tag,
  Clock,
  Calendar,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Loader2,
  Terminal,
} from "lucide-react";

interface PublicBlogItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: string | null;
  coverImage?: string | null;
  createdAt: string;
}

interface PublicBlogsResponse {
  data: PublicBlogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORIES = [
  "All",
  "Application Security",
  "Cloud & DevSecOps",
  "Threat Intelligence",
  "Career & Hiring",
  "Offensive Security",
  "Governance & Compliance",
];

function calculateReadTime(text?: string | null): number {
  if (!text) return 3;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function BlogsContent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [blogs, setBlogs] = useState<PublicBlogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "9");
      if (selectedCategory !== "All") {
        params.set("category", selectedCategory);
      }

      const res = await fetch(`/api/public/blog?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const payload = json?.success && json?.data !== undefined ? json.data : json;
        const items: PublicBlogItem[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.items)
              ? payload.items
              : [];

        setBlogs(items);
        setTotal(payload?.total ?? items.length);
        setTotalPages(payload?.totalPages ?? (Math.ceil((payload?.total ?? items.length) / 9) || 1));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Client-side search filter on the current page's results
  const filteredBlogs = blogs.filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.title.toLowerCase().includes(term) ||
      b.excerpt?.toLowerCase().includes(term) ||
      b.category?.toLowerCase().includes(term)
    );
  });

  const featuredBlog = filteredBlogs.length > 0 ? filteredBlogs[0] : null;
  const gridBlogs = filteredBlogs.length > 1 ? filteredBlogs.slice(1) : [];
  const gridItems = searchTerm || page > 1 ? filteredBlogs : gridBlogs;
  const blogAdPositions = getGridAdPositions(gridItems.length);

  return (
    <main className="min-h-screen bg-slate-50 pt-16">
      {/* ── Hero Header ── */}
      <div className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-grid-md opacity-40" />

        {/* Circuit lines decorative top-right */}
        <svg
          className="absolute top-0 right-0 w-80 h-80 pointer-events-none opacity-30"
          viewBox="0 0 280 280"
          fill="none"
        >
          <path
            d="M280 60 L220 60 L220 20 L140 20"
            stroke="#3B82F6"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <path
            d="M280 140 L200 140 L200 90 L110 90"
            stroke="#06B6D4"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <circle cx="220" cy="60" r="3.5" fill="#3B82F6" />
          <circle cx="200" cy="140" r="3.5" fill="#06B6D4" />
        </svg>

        {/* Corner brackets */}
        <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
        <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-blue-200 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-mono tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            CYKRUIT DISPATCH & RESEARCH
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
            Security Insights, Guides &{" "}
            <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-0.5 relative terminal-badge terminal-badge-page text-blue-600 bg-blue-50 border border-blue-100">
              Dispatches
            </span>
          </h1>

          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Deep-dives into vulnerability research, application security, cloud architecture,
            career trajectories, and the future of cybersecurity hiring.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles by title, keyword, or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* ── Category Filter Bar ── */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Articles Section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Fetching articles...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No articles found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {searchTerm || selectedCategory !== "All"
                ? "No matching articles found for your criteria. Try adjusting your search query or category."
                : "No articles published yet. Check back soon for fresh infosec dispatches."}
            </p>
            {(searchTerm || selectedCategory !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Article Banner (First Item) */}
            {featuredBlog && !searchTerm && page === 1 && (
              <Link
                href={`/blogs/${featuredBlog.slug}`}
                className="group block relative rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 h-64 sm:h-80 lg:h-full bg-slate-900 relative overflow-hidden">
                    {featuredBlog.coverImage ? (
                      <img
                        src={featuredBlog.coverImage}
                        alt={featuredBlog.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-blue-400">
                        <Shield className="h-16 w-16 opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-md">
                        Featured Dispatch
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        {featuredBlog.category && (
                          <span className="font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                            {featuredBlog.category}
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(featuredBlog.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition leading-tight">
                        {featuredBlog.title}
                      </h2>

                      {featuredBlog.excerpt && (
                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {featuredBlog.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold text-blue-600">
                      <span className="flex items-center space-x-1 text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{calculateReadTime(featuredBlog.excerpt)} min read</span>
                      </span>
                      <span className="flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                        <span>Read Article</span>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <AdSlot slotKey="blogs-banner" />

            {/* Grid of Remaining / Filtered Articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridItems.map((blog, i) => (
                <Fragment key={blog.id}>
                <Link
                  href={`/blogs/${blog.slug}`}
                  className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden"
                >
                  {/* Cover */}
                  <div className="h-48 w-full bg-slate-900 relative overflow-hidden flex-shrink-0">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-400">
                        <Shield className="h-12 w-12 opacity-30" />
                      </div>
                    )}
                    {blog.category && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs border border-white/60">
                          {blog.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(blog.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{calculateReadTime(blog.excerpt)} min read</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                        {blog.title}
                      </h3>

                      {blog.excerpt && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                          {blog.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                      <span>Read More</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
                {blogAdPositions.has(i + 1) && <AdSlot slotKey="blogs-grid" />}
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

export default function BlogsPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-slate-50 pt-20 text-center text-sm text-slate-400">Loading...</div>}>
        <BlogsContent />
      </Suspense>
      <Footer />
    </>
  );
}
