"use client";

// cykruit-ui/app/blogs/[slug]/_components/article-renderer.tsx
// Client Social Share Controls & Link Copy Feedback

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";

interface ArticleContentRendererProps {
  postTitle: string;
  slug: string;
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function ArticleContentRenderer({
  postTitle,
  slug,
}: ArticleContentRendererProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const articleUrl = typeof window !== "undefined" ? window.location.href : `https://cykruit.com/blogs/${slug}`;
  const shareText = encodeURIComponent(`${postTitle} via @Cykruit`);

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={handleCopyLink}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs"
        title="Copy article link"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Link Copied!</span>
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5 text-slate-400" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      <a
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(articleUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs"
        title="Share on X"
      >
        <TwitterIcon />
      </a>

      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-700 transition shadow-2xs"
        title="Share on LinkedIn"
      >
        <LinkedInIcon />
      </a>
    </div>
  );
}
