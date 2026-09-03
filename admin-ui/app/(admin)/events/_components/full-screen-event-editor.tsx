'use client';

// admin-ui/app/(admin)/events/_components/full-screen-event-editor.tsx
// Full-Screen Markdown Event Editor — mirrors full-screen-blog-editor.tsx,
// swapping excerpt/coverImage for description/bannerImage and adding
// location + eventDate fields.

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib';
import type { Event as WhatsNewEvent } from '@/lib';
import { Button, useToast } from '@/components/ui';
import {
  Save,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  Tag,
  MapPin,
  Calendar,
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
} from 'lucide-react';
import MarkdownIt from 'markdown-it';

interface FullScreenEventEditorProps {
  initialEvent?: WhatsNewEvent;
  eventId?: string;
}

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

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: true });

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

export default function FullScreenEventEditor({ initialEvent, eventId }: FullScreenEventEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState<string>(initialEvent?.title || '');
  const [slug, setSlug] = useState<string>(initialEvent?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState<boolean>(!!initialEvent?.slug);
  const [category, setCategory] = useState<string>(initialEvent?.category || '');
  const [location, setLocation] = useState<string>(initialEvent?.location || '');
  const [eventDate, setEventDate] = useState<string>(toDateInputValue(initialEvent?.eventDate));
  const [bannerImage, setBannerImage] = useState<string>(initialEvent?.bannerImage || '');
  const [description, setDescription] = useState<string>(initialEvent?.description || '');
  const [content, setContent] = useState<string>(initialEvent?.content || '');
  const [isPublished, setIsPublished] = useState<boolean>(initialEvent?.isPublished ?? true);

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'write' | 'preview'>('split');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<{ past: string[]; future: string[] }>({ past: [], future: [] });

  const pushHistory = (prevState: string) => {
    setHistory((prev) => ({ past: [...prev.past.slice(-100), prevState], future: [] }));
  };

  const handleUndo = () => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    setHistory((prev) => ({ past: prev.past.slice(0, -1), future: [content, ...prev.future] }));
    setContent(previous);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    setHistory((prev) => ({ past: [...prev.past, content], future: prev.future.slice(1) }));
    setContent(next);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) { e.preventDefault(); handleRedo(); } else { e.preventDefault(); handleUndo(); }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    pushHistory(content);
    setContent(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugManuallyEdited) setSlug(slugify(val));
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

  const wordCount = useMemo(() => (content.trim() ? content.trim().split(/\s+/).length : 0), [content]);
  const readingTime = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount]);
  const renderedHtml = useMemo(() => {
    if (!content.trim()) return '';
    try {
      return md.render(content);
    } catch {
      return content;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ type: 'error', message: 'Event title is required.' });
      return;
    }
    if (!eventDate) {
      toast({ type: 'error', message: 'Event date is required.' });
      return;
    }

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim() ? slugify(slug.trim()) : slugify(title.trim()),
      category: category.trim() || undefined,
      location: location.trim() || undefined,
      eventDate: new Date(eventDate).toISOString(),
      bannerImage: bannerImage.trim() || undefined,
      description: description.trim() || undefined,
      content: content.trim() || undefined,
      isPublished,
    };

    try {
      const targetId = eventId || initialEvent?.id;
      if (targetId) {
        await api.patch(`/api/admin/events/${targetId}`, payload);
        toast({ type: 'success', message: 'Event updated successfully.' });
      } else {
        await api.post('/api/admin/events', payload);
        toast({ type: 'success', message: 'Event published successfully.' });
      }
      router.push('/events');
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save event.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-7rem)] min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* ── Top Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0 space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full lg:flex-1">
            <Link
              href="/events"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shrink-0"
              title="Back to Events List"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <input
              type="text"
              required
              placeholder="Event Title (e.g. Cykruit Live: Cloud Threat Hunting Workshop)..."
              value={title}
              onChange={handleTitleChange}
              className="w-full text-xl sm:text-2xl font-bold text-slate-900 placeholder:text-slate-300 bg-transparent border-0 border-b-2 border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none py-1 transition tracking-tight"
            />
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-end lg:self-center">
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                showSettings || bannerImage || description
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Settings</span>
              {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            <label className="hidden sm:flex items-center space-x-2 cursor-pointer select-none bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-600"
              />
              <span className="text-xs font-semibold text-slate-800">{isPublished ? 'Published Live' : 'Draft'}</span>
            </label>

            <Button type="submit" variant="primary" disabled={submitting} className="flex items-center space-x-1.5 shadow-sm">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{initialEvent || eventId ? 'Update Event' : 'Publish Event'}</span>
            </Button>
          </div>
        </div>

        {showSettings && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-3 space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>URL Slug</span>
                <span className="text-[10px] text-slate-400 font-normal">/whats-new/slug</span>
              </label>
              <input
                type="text"
                placeholder="custom-event-slug"
                value={slug}
                onChange={(e) => { setSlugManuallyEdited(true); setSlug(e.target.value); }}
                className="w-full px-3 py-1.5 font-mono text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                <span>Category</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Seminar, CTF, Webinar"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-6 space-y-1">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>Location (or &quot;Online&quot;)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Online / San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-12 space-y-1">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                <span>Banner Image URL</span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-12 space-y-1">
              <label className="font-bold text-slate-700">Summary Description (Card summary & SEO Meta description)</label>
              <textarea
                rows={2}
                placeholder="A concise 1-2 sentence overview of the event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Formatting Toolbar & View Mode Switcher ── */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-2 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-1 text-slate-700">
          <button type="button" onClick={() => insertSnippet('# ', '\n', 'Heading 1')} title="Heading 1" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Heading1 className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('## ', '\n', 'Heading 2')} title="Heading 2" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Heading2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('### ', '\n', 'Heading 3')} title="Heading 3" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Heading3 className="h-4 w-4" /></button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button type="button" onClick={() => insertSnippet('**', '**', 'bold text')} title="Bold" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Bold className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('*', '*', 'italic text')} title="Italic" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Italic className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('~~', '~~', 'strikethrough')} title="Strikethrough" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Strikethrough className="h-4 w-4" /></button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button type="button" onClick={() => insertSnippet('`', '`', 'code')} title="Inline Code" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Code className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('```\n', '\n```', 'code block')} title="Code Block" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><FileCode className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('> ', '\n', 'Blockquote')} title="Blockquote" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Quote className="h-4 w-4" /></button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button type="button" onClick={() => insertSnippet('* ', '\n', 'List item')} title="Bullet List" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><List className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('1. ', '\n', 'Ordered item')} title="Numbered List" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><ListOrdered className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('[', '](https://cykruit.com)', 'Link Title')} title="Hyperlink" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Link2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('![', '](https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800)', 'Illustration Alt')} title="Insert Image" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><ImageIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertSnippet('\n---\n\n', '', '')} title="Horizontal Rule" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-700 transition"><Minus className="h-4 w-4" /></button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button type="button" onClick={handleUndo} disabled={history.past.length === 0} title="Undo (Ctrl+Z)" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-600 disabled:opacity-30 transition"><Undo2 className="h-4 w-4" /></button>
          <button type="button" onClick={handleRedo} disabled={history.future.length === 0} title="Redo (Ctrl+Y)" className="p-1.5 hover:bg-white hover:shadow-2xs rounded-lg text-slate-600 disabled:opacity-30 transition"><Redo2 className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
          <button type="button" onClick={() => setViewMode('split')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${viewMode === 'split' ? 'bg-white text-blue-900 shadow-2xs' : 'hover:text-slate-900'}`}><Columns2 className="h-3.5 w-3.5" /><span>Split View</span></button>
          <button type="button" onClick={() => setViewMode('write')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${viewMode === 'write' ? 'bg-white text-blue-900 shadow-2xs' : 'hover:text-slate-900'}`}><Edit3 className="h-3.5 w-3.5" /><span>Editor Only</span></button>
          <button type="button" onClick={() => setViewMode('preview')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${viewMode === 'preview' ? 'bg-white text-blue-900 shadow-2xs' : 'hover:text-slate-900'}`}><Eye className="h-3.5 w-3.5" /><span>Reader Preview</span></button>
        </div>
      </div>

      {/* ── Dual-Pane Canvas ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-white">
        {(viewMode === 'split' || viewMode === 'write') && (
          <div className={`h-full min-h-0 flex flex-col overflow-hidden border-r border-slate-200 ${viewMode === 'write' ? 'md:col-span-2' : ''}`}>
            <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider flex-shrink-0">
              <span>Markdown Source Editor</span>
              <span>Markdown-it GFM</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Paste or write the full event write-up here (optional)...&#10;&#10;# What to expect&#10;* Agenda item one&#10;* Agenda item two&#10;&#10;## Registration&#10;[Register here](https://...)"
              className="flex-1 min-h-0 w-full p-8 text-sm font-mono text-slate-800 bg-white focus:outline-none resize-none leading-relaxed overflow-y-auto"
            />
          </div>
        )}

        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`h-full min-h-0 flex flex-col overflow-hidden bg-slate-50/40 ${viewMode === 'preview' ? 'md:col-span-2' : ''}`}>
            <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider flex-shrink-0">
              <span>Live Rendered Preview</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <div className="flex-1 min-h-0 p-8 sm:p-12 overflow-y-auto bg-white">
              {bannerImage && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 shadow-xs max-h-72 bg-slate-900">
                  <img src={bannerImage} alt="Event Banner Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {category && (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {category}
                    </span>
                  )}
                  {eventDate && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  {location && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {location}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-2 leading-tight tracking-tight">
                  {title || 'Untitled Event'}
                </h1>
                {description && (
                  <p className="text-sm text-slate-600 italic border-l-4 border-blue-600 pl-4 py-1.5 mt-4 bg-slate-50 rounded-r-lg leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <div
                className="markdown-rendered-content"
                dangerouslySetInnerHTML={{
                  __html: renderedHtml || '<p style="color:#94a3b8;font-style:italic;">No content written yet.</p>',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-500 font-medium flex-shrink-0">
        <div className="flex items-center space-x-3">
          <span className="font-mono">{wordCount} words</span>
          <span>•</span>
          <span>~{readingTime} min read</span>
        </div>
      </div>
    </form>
  );
}
