'use client';

// admin-ui/app/(admin)/blogs/_components/full-screen-blog-editor.tsx
// Full-Screen Immersive Markdown Blog Editor with Markdown-it Dual-Pane Preview

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib';
import type { Blog } from '@/lib';
import { Button, useToast } from '@/components/ui';
import {
  Save,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  Tag,
  FileText,
  Eye,
  Edit3,
  Columns2,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Code,
  FileCode,
  Quote,
  List,
  ListOrdered,
  Link2,
  Minus,
  Undo2,
  Redo2,
  Settings2,
  ChevronDown,
  ChevronUp,
  Globe,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import MarkdownIt from 'markdown-it';

interface FullScreenBlogEditorProps {
  initialBlog?: Blog;
  blogId?: string;
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
  const srcIndex = token.attrIndex('src');
  const rawSrc = srcIndex >= 0 && token.attrs ? token.attrs[srcIndex][1] : '';
  const src = typeof rawSrc === 'string' ? rawSrc : String(rawSrc || '');

  const isPlaceholder = !src || src.startsWith('IMAGE_URL') || src === '#';
  if (isPlaceholder) {
    return `<div class="my-5 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5"><span class="font-medium text-slate-700">🖼 Image: ${token.content || 'Illustration'}</span><span class="text-[11px] text-slate-400 font-mono">Insert a valid URL in ![alt](https://...) to load preview</span></div>`;
  }

  token.attrPush(['loading', 'lazy']);
  token.attrPush(['referrerpolicy', 'no-referrer']);
  token.attrPush(['class', 'rounded-xl border border-slate-200 shadow-xs my-5 max-w-full h-auto mx-auto']);
  return defaultImageRule(tokens, idx, options, env, self);
};

const defaultLinkRule =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  token.attrPush(['target', '_blank']);
  token.attrPush(['rel', 'noopener noreferrer']);
  token.attrPush(['class', 'text-blue-600 font-semibold underline hover:text-blue-800']);
  return defaultLinkRule(tokens, idx, options, env, self);
};

export default function FullScreenBlogEditor({
  initialBlog,
  blogId,
}: FullScreenBlogEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState<string>(initialBlog?.title || '');
  const [slug, setSlug] = useState<string>(initialBlog?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState<boolean>(!!initialBlog?.slug);
  const [category, setCategory] = useState<string>(initialBlog?.category || 'Application Security');
  const [coverImage, setCoverImage] = useState<string>(initialBlog?.coverImage || '');
  const [excerpt, setExcerpt] = useState<string>(initialBlog?.excerpt || '');
  const [content, setContent] = useState<string>(initialBlog?.content || '');
  const [isPublished, setIsPublished] = useState<boolean>(initialBlog?.isPublished ?? true);

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'write' | 'preview'>('split');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Undo/Redo history stack
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

  const insertSnippet = (openTag: string, closeTag: string = '', defaultPlaceholder: string = 'text') => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : content.length;
    const end = textarea ? textarea.selectionEnd : content.length;
    const selected = content.substring(start, end) || defaultPlaceholder;
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

  // Metrics computation
  const wordCount = useMemo(() => {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).length;
  }, [content]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const renderedHtml = useMemo(() => {
    if (!content || !content.trim()) return '';
    try {
      return md.render(content);
    } catch {
      return content;
    }
  }, [content]);

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
      const targetId = blogId || initialBlog?.id;
      if (targetId) {
        await api.patch(`/api/admin/blogs/${targetId}`, payload);
        toast({ type: 'success', message: 'Article updated successfully.' });
      } else {
        await api.post('/api/admin/blogs', payload);
        toast({ type: 'success', message: 'Article published successfully.' });
      }
      router.push('/blogs');
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
    <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-7rem)] min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* ── Top Header Navigation & Primary Controls ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0 space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Back button & Title Input */}
          <div className="flex items-center space-x-3 w-full lg:flex-1">
            <Link
              href="/blogs"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex-shrink-0"
              title="Back to Blog List"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <input
              type="text"
              required
              placeholder="Article Title (e.g. Artificial Intelligence in Risk Management)..."
              value={title}
              onChange={handleTitleChange}
              className="w-full text-xl sm:text-2xl font-bold text-slate-900 placeholder:text-slate-300 bg-transparent border-0 border-b-2 border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none py-1 transition tracking-tight"
            />
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3 flex-shrink-0 self-end lg:self-center">
            {/* Category domain selector */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Collapsible Settings Button */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                showSettings || coverImage || excerpt
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Settings</span>
              {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {/* Publication Toggle */}
            <label className="hidden sm:flex items-center space-x-2 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-600"
              />
              <span className="text-xs font-semibold text-slate-800">
                {isPublished ? 'Published Live' : 'Draft'}
              </span>
            </label>

            {/* Save & Publish Action */}
            <Button type="submit" variant="primary" disabled={submitting} className="flex items-center space-x-1.5 shadow-sm">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{initialBlog || blogId ? 'Update Article' : 'Publish Article'}</span>
            </Button>
          </div>
        </div>

        {/* Collapsible Metadata Drawer (Slug, Cover URL, Excerpt) */}
        {showSettings && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs animate-in fade-in duration-200">
            {/* Slug */}
            <div className="md:col-span-4 space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>URL Slug Path</span>
                <span className="text-[10px] text-slate-400 font-normal">/blogs/slug</span>
              </label>
              <div className="flex items-center rounded-lg border border-slate-300 px-3 bg-white focus-within:ring-2 focus-within:ring-blue-600">
                <span className="text-xs text-slate-400 font-mono">/blogs/</span>
                <input
                  type="text"
                  placeholder="custom-article-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(e.target.value);
                  }}
                  className="w-full py-1.5 pl-1 font-mono text-xs bg-transparent focus:outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Cover Image URL */}
            <div className="md:col-span-8 space-y-1">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                <span>Cover Image URL (WebP, JPG, PNG, Unsplash)</span>
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Excerpt */}
            <div className="md:col-span-12 space-y-1">
              <label className="font-bold text-slate-700">Summary Excerpt (Card summary & SEO Meta description)</label>
              <textarea
                rows={2}
                placeholder="A concise 1-2 sentence overview of the article..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Formatting Toolbar & View Mode Switcher ── */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-2 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        {/* Markdown Action Buttons */}
        <div className="flex flex-wrap items-center gap-1 text-slate-700">
          <button
            type="button"
            onClick={() => insertSnippet('# ', '\n', 'Heading 1')}
            title="Heading 1"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('## ', '\n', 'Heading 2')}
            title="Heading 2"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('### ', '\n', 'Heading 3')}
            title="Heading 3"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Heading3 className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => insertSnippet('**', '**', 'bold text')}
            title="Bold (**text**)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('*', '*', 'italic text')}
            title="Italic (*text*)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('~~', '~~', 'strikethrough')}
            title="Strikethrough (~~text~~)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => insertSnippet('`', '`', 'code')}
            title="Inline Code (`code`)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('```typescript\n', '\n```', 'console.log("Infosec code");')}
            title="Code Block (```lang...)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <FileCode className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('> ', '\n', 'Blockquote')}
            title="Blockquote (> quote)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Quote className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => insertSnippet('* ', '\n', 'List item')}
            title="Bullet List (* item)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('1. ', '\n', 'Ordered item')}
            title="Numbered List (1. item)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('[', '](https://cykruit.com)', 'Link Title')}
            title="Hyperlink ([text](url))"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('![', '](https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800)', 'Illustration Alt')}
            title="Insert Image (![alt](url))"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('\n---\n\n', '', '')}
            title="Horizontal Rule (---)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.past.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-600 disabled:opacity-30 transition"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={history.future.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-600 disabled:opacity-30 transition"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* View Mode Switcher (Split / Write / Preview) */}
        <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
              viewMode === 'split' ? 'bg-white text-blue-900 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>Split View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
              viewMode === 'write' ? 'bg-white text-blue-900 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Editor Only</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
              viewMode === 'preview' ? 'bg-white text-blue-900 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Reader Preview</span>
          </button>
        </div>
      </div>

      {/* ── Dual-Pane Canvas (Editor & Live Preview) ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-white">
        {/* Left Pane: Markdown Editor */}
        {(viewMode === 'split' || viewMode === 'write') && (
          <div
            className={`h-full min-h-0 flex flex-col overflow-hidden border-r border-slate-200 ${
              viewMode === 'write' ? 'md:col-span-2' : ''
            }`}
          >
            <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider flex-shrink-0">
              <span>Markdown Source Editor</span>
              <span>Markdown-it GFM</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Paste or write your Markdown content here...&#10;&#10;# Article Title&#10;&#10;Traditionally, **People, Process, and Technology** are considered the key components...&#10;&#10;## Risk Considerations&#10;* Maker-checker controls&#10;* Segregation of duties&#10;&#10;1. **Privacy and security risks**&#10;   AI systems can process large amounts of data.&#10;&#10;![Illustration](https://...)"
              className="flex-1 min-h-0 w-full p-8 text-sm font-mono text-slate-800 bg-white focus:outline-none resize-none leading-relaxed overflow-y-auto"
            />
          </div>
        )}

        {/* Right Pane: Live Rendered GFM Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            className={`h-full min-h-0 flex flex-col overflow-hidden bg-slate-50/40 ${
              viewMode === 'preview' ? 'md:col-span-2' : ''
            }`}
          >
            <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider flex-shrink-0">
              <span>Live Rendered Preview</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="flex-1 min-h-0 p-8 sm:p-12 overflow-y-auto bg-white">
              {/* Cover Image Preview Banner */}
              {coverImage && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 shadow-xs max-h-72 bg-slate-900">
                  <img
                    src={coverImage}
                    alt="Article Cover Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title & Category Header in Preview */}
              <div className="mb-8 pb-6 border-b border-slate-100">
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  {category}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-2 leading-tight tracking-tight">
                  {title || 'Untitled Article'}
                </h1>
                {excerpt && (
                  <p className="text-sm text-slate-600 italic border-l-4 border-blue-600 pl-4 py-1.5 mt-4 bg-slate-50 rounded-r-lg leading-relaxed">
                    {excerpt}
                  </p>
                )}
              </div>

              {/* Rendered Markdown-it Content */}
              <div
                className="markdown-rendered-content"
                dangerouslySetInnerHTML={{
                  __html:
                    renderedHtml ||
                    '<p style="color:#94a3b8;font-style:italic;">No article content written yet. Start typing in the Markdown editor on the left.</p>',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Status Bar ── */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-500 font-medium flex-shrink-0">
        <div className="flex items-center space-x-3">
          <span className="font-mono">{wordCount} words</span>
          <span>•</span>
          <span>~{readingTime} min read</span>
          <span>•</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-mono border border-emerald-100">
            Markdown-it Enabled
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span>Auto-saving draft locally</span>
        </div>
      </div>
    </form>
  );
}
