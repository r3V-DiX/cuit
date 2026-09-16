'use client';

// admin-ui/app/(admin)/ads/_components/ad-editor-modal.tsx

import { useRef, useState } from 'react';
import { api, getCsrfToken } from '@/lib';
import type { Ad } from '@/lib';
import { Button, Combobox, useToast } from '@/components/ui';
import { Save, Loader2, Image as ImageIcon, Link2, Tag, Type, Upload, X } from 'lucide-react';

interface AdEditorModalProps {
  initialAd?: Ad;
  onSuccess: () => void;
  onCancel: () => void;
}

const KNOWN_SLOTS = [
  'jobs-grid',
  'blogs-banner',
  'blogs-grid',
  'blog-article-end',
  'whats-new-grid',
  'whats-new-article-end',
];

const IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export default function AdEditorModal({ initialAd, onSuccess, onCancel }: AdEditorModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [slotKey, setSlotKey] = useState<string>(initialAd?.slotKey || '');
  const [imageUrl, setImageUrl] = useState<string>(initialAd?.imageUrl || '');
  const [previewUrl, setPreviewUrl] = useState<string>(initialAd?.previewUrl || initialAd?.imageUrl || '');
  const [linkUrl, setLinkUrl] = useState<string>(initialAd?.linkUrl || '');
  const [altText, setAltText] = useState<string>(initialAd?.altText || '');
  const [isActive, setIsActive] = useState<boolean>(initialAd?.isActive ?? true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
      toast({ type: 'error', message: 'Only JPEG, PNG, or WebP images are allowed.' });
      e.target.value = '';
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      toast({ type: 'error', message: 'Image must be 5MB or smaller.' });
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/admin/ads/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-csrf-token': getCsrfToken() ?? '' },
        body: formData,
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message || body?.message || 'Upload failed');
      }
      setImageUrl(body.data.imageUrl);
      setPreviewUrl(body.data.previewUrl || body.data.imageUrl);
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to upload image.',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotKey.trim() || !imageUrl.trim() || !linkUrl.trim() || !altText.trim()) {
      toast({ type: 'error', message: 'Slot, image, link URL, and alt text are all required.' });
      return;
    }

    setSubmitting(true);

    const payload = {
      slotKey: slotKey.trim(),
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl.trim(),
      altText: altText.trim(),
      isActive,
    };

    try {
      if (initialAd) {
        await api.patch(`/api/admin/ads/${initialAd.id}`, payload);
        toast({ type: 'success', message: 'Ad updated successfully.' });
      } else {
        await api.post('/api/admin/ads', payload);
        toast({ type: 'success', message: 'Ad created successfully.' });
      }
      onSuccess();
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save ad.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
          <Tag className="h-3.5 w-3.5 text-slate-500" />
          <span>Slot</span>
        </label>
        <Combobox
          value={slotKey}
          onChange={setSlotKey}
          options={KNOWN_SLOTS}
          required
          placeholder="e.g. jobs-grid"
        />
        <p className="text-[11px] text-slate-400">
          Which page position this ad shows in. Multiple ads can target the same slot — the
          most recently updated active one wins.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
          <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
          <span>Creative Image</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {imageUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
            <img src={previewUrl || imageUrl} alt="Preview" referrerPolicy="no-referrer" className="w-full max-h-48 object-contain" />
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-slate-800 hover:bg-slate-100 transition"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => { setImageUrl(''); setPreviewUrl(''); }}
                className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
                title="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-8 text-slate-400 hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-600 transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-xs font-semibold">
              {uploading ? 'Uploading…' : 'Click to upload an image'}
            </span>
            <span className="text-[11px] text-slate-400">JPEG, PNG, or WebP — up to 5MB</span>
          </button>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
          <Link2 className="h-3.5 w-3.5 text-slate-500" />
          <span>Link URL</span>
        </label>
        <input
          type="url"
          required
          placeholder="https://..."
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
          <Type className="h-3.5 w-3.5 text-slate-500" />
          <span>Alt Text</span>
        </label>
        <input
          type="text"
          required
          placeholder="Short description for accessibility"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <label className="flex items-center space-x-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-600"
        />
        <span className="text-xs font-semibold text-slate-800">Active</span>
      </label>

      <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting || uploading} className="flex items-center space-x-1.5">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{initialAd ? 'Update Ad' : 'Create Ad'}</span>
        </Button>
      </div>
    </form>
  );
}
