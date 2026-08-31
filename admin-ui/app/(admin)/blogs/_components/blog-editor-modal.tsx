'use client';

// admin-ui/app/(admin)/blogs/_components/blog-editor-modal.tsx
// Rich Blog Editor Modal with Live Preview and History Stack (Ctrl+Z)

import { useState, useRef } from 'react';
import { api } from '@/lib';
import type { Blog } from '@/lib';
import { Button, useToast } from '@/components/ui';
import {
  Save,
  Loader2,
  Image as ImageIcon,
  Tag,
  FileText,
  Eye,
  Edit,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Code,
  Quote,
  List,
  Link2,
  Undo2,
  Redo2,
  Globe,
  Sparkles,
} from 'lucide-react';

interface BlogEditorModalProps {
  initialBlog?: Blog;
  onSuccess: () => void;
  onCancel: () => void;
}

const PRESET_CATEGORIES = [
  'Application Security',
  'Cloud & DevSecOps',
  'Threat Intelligence',
  'Career & Hiring',
  'Offensive Security',
  'Governance & Compliance',
  'Incident Response',
  'Platform News',
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseMarkdownToHtml(raw: string): string {
  if (!raw || !raw.trim()) return '';

  if (raw.includes('<p>') || raw.includes('<h2>') || raw.includes('<h3>') || raw.includes('<div>')) {
    return raw;
  }

  let html = raw;

  // Code blocks: ```lang ... ```
  html = html.replace(/```([\w]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre style="background:#0f172a;color:#f8fafc;padding:12px;border-radius:8px;font-family:monospace;font-size:12px;overflow-x:auto;margin:12px 0;"><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;color:#0f172a;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:11px;">$1</code>');

  // Headers: ###, ##, #
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:16px 0 6px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size:18px;font-weight:800;color:#0f172a;margin:20px 0 8px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:24px 0 10px;">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Blockquotes: > quote
  html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left:4px solid #2563eb;background:#eff6ff;padding:8px 12px;margin:12px 0;border-radius:0 6px 6px 0;color:#1e3a8a;font-style:italic;">$1</blockquote>');

  // Links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">$1</a>');

  // Bullet Lists: - item or * item
  html = html.replace(/^[\*\-] (.*$)/gim, '<li style="margin-left:20px;list-style-type:disc;">$1</li>');

  // Numbered Lists: 1. item
  html = html.replace(/^\d+\. (.*$)/gim, '<li style="margin-left:20px;list-style-type:decimal;">$1</li>');

  // Wrap consecutive <li> into <ul> or <ol>
  html = html.replace(/(<li style="margin-left:20px;list-style-type:disc;">[\s\S]*?<\/li>)+/g, '<ul style="margin:10px 0;padding-left:10px;">$&</ul>');
  html = html.replace(/(<li style="margin-left:20px;list-style-type:decimal;">[\s\S]*?<\/li>)+/g, '<ol style="margin:10px 0;padding-left:10px;">$&</ol>');

  // Paragraphs
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol')
      ) {
        return trimmed;
      }
      return `<p style="margin-bottom:10px;line-height:1.6;">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return html;
}

export default function BlogEditorModal({
  initialBlog,
  onSuccess,
  onCancel,
}: BlogEditorModalProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState<string>(initialBlog?.title || '');
  const [slug, setSlug] = useState<string>(initialBlog?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState<boolean>(!!initialBlog?.slug);
  const [category, setCategory] = useState<string>(initialBlog?.category || 'Application Security');
  const [coverImage, setCoverImage] = useState<string>(initialBlog?.coverImage || '');
  const [excerpt, setExcerpt] = useState<string>(initialBlog?.excerpt || '');
  const [content, setContent] = useState<string>(initialBlog?.content || '');
  const [isPublished, setIsPublished] = useState<boolean>(initialBlog?.isPublished ?? true);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Explicit history stack for Ctrl+Z / Ctrl+Y
  const [history, setHistory] = useState<{ past: string[]; future: string[] }>({
    past: [],
    future: [],
  });

  const pushHistory = (prevState: string) => {
    setHistory((prev) => ({
      past: [...prev.past.slice(-100), prevState],
      future: [],
    }));
  };

  const handleUndo = () => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    setHistory((prev) => ({
      past: newPast,
      future: [content, ...prev.future],
    }));
    setContent(previous);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory((prev) => ({
      past: [...prev.past, content],
      future: newFuture,
    }));
    setContent(next);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else {
        e.preventDefault();
        handleUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    pushHistory(content);
    setContent(newVal);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const insertTagWrapper = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : content.length;
    const end = textarea ? textarea.selectionEnd : content.length;
    const selected = content.substring(start, end) || 'text';
    const replacement = `${openTag}${selected}${closeTag}`;
    const nextVal = content.substring(0, start) + replacement + content.substring(end);

    pushHistory(content);
    setContent(nextVal);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ type: 'error', message: 'Article title is required.' });
      return;
    }

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim() ? slugify(slug.trim()) : slugify(title.trim()),
      category: category.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      content: content.trim() || undefined,
      isPublished,
    };

    try {
      if (initialBlog) {
        await api.patch(`/api/admin/blogs/${initialBlog.id}`, payload);
        toast({ type: 'success', message: 'Article updated successfully.' });
      } else {
        await api.post('/api/admin/blogs', payload);
        toast({ type: 'success', message: 'Article created successfully.' });
      }
      onSuccess();
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save blog article.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] flex flex-col">
      {/* ── Metadata Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-700">
            Article Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Top 10 Cybersecurity Trends for Cloud Infrastructure in 2026"
            value={title}
            onChange={handleTitleChange}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>URL Slug</span>
            <span className="text-[10px] text-slate-400 font-normal">Auto-generated from title</span>
          </label>
          <div className="flex items-center rounded-lg border border-slate-300 px-3 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white">
            <span className="text-xs text-slate-400 font-mono">/blogs/</span>
            <input
              type="text"
              placeholder="top-10-cybersecurity-trends"
              value={slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setSlug(e.target.value);
              }}
              className="w-full py-2 pl-1 text-xs font-mono bg-transparent focus:outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Category Domain</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            {PRESET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Cover Image URL */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
            <span>Cover Image URL</span>
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
          />
        </div>

        {/* Excerpt */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Summary Excerpt</span>
            <span className="text-[10px] text-slate-400 font-normal">Displayed on cards & search</span>
          </label>
          <textarea
            rows={2}
            placeholder="A brief 1-2 sentence overview of the key findings or takeaways from this article..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
          />
        </div>
      </div>

      {/* ── Content Editor & Live Preview Area ── */}
      <div className="space-y-2 flex-1 flex flex-col border border-slate-200 rounded-xl p-3 bg-white">
        {/* Editor Controls & Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
          {/* Write / Preview Mode Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'write'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          {/* Quick Formatting Tools */}
          {activeTab === 'write' && (
            <div className="flex items-center space-x-1 text-slate-700">
              <button
                type="button"
                onClick={() => insertTagWrapper('**', '**')}
                title="Bold"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertTagWrapper('*', '*')}
                title="Italic"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertTagWrapper('## ', '\n')}
                title="Heading 2"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertTagWrapper('### ', '\n')}
                title="Heading 3"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
              >
                <Heading3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertTagWrapper('```bash\n', '\n```')}
                title="Code Block"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
              >
                <Code className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertTagWrapper('> ', '\n')}
                title="Blockquote"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
              >
                <Quote className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertTagWrapper('- ', '\n')}
                title="Bullet List"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertTagWrapper('[', '](https://cykruit.com)')}
                title="Link"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
              >
                <Link2 className="h-3.5 w-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              {/* Undo & Redo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.past.length === 0}
                title="Undo (Ctrl+Z)"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 transition"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={history.future.length === 0}
                title="Redo (Ctrl+Y)"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 transition"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Textarea or Rendered HTML */}
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            rows={12}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Write article content in Markdown or HTML format...&#10;&#10;## Introduction&#10;In this article we examine...&#10;&#10;```typescript&#10;console.log('AppSec insights');&#10;```"
            className="w-full px-3.5 py-3 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-900 text-slate-100 leading-relaxed flex-1 min-h-[260px]"
          />
        ) : (
          <div className="p-5 bg-white rounded-lg border border-slate-200 overflow-y-auto max-h-[420px] min-h-[260px] text-slate-800 space-y-4">
            {coverImage && (
              <div className="w-full h-48 rounded-xl overflow-hidden shadow-xs border border-slate-200">
                <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                {category}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-2 mb-1">{title || 'Untitled Article'}</h1>
              {slug && <p className="text-[11px] font-mono text-slate-400">/blogs/{slug}</p>}
            </div>

            {excerpt && (
              <div className="p-3 bg-slate-50 border-l-4 border-blue-600 rounded-r-lg text-xs text-slate-700 italic leading-relaxed">
                {excerpt}
              </div>
            )}

            <div
              className="text-xs text-slate-800 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{
                __html:
                  parseMarkdownToHtml(content) ||
                  '<p style="color:#94a3b8;font-style:italic;">No article content written yet.</p>',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Footer & Publication Switch ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <label className="flex items-center space-x-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-600"
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800">
              {isPublished ? 'Publish Live' : 'Save as Draft'}
            </span>
            <span className="text-[11px] text-slate-500">
              {isPublished ? 'Immediately visible on public blog catalog' : 'Only visible to admins'}
            </span>
          </div>
        </label>

        <div className="flex items-center space-x-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting} className="flex items-center space-x-1.5">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{initialBlog ? 'Update Article' : 'Save & Publish'}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
