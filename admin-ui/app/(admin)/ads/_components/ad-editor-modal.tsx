'use client';

// admin-ui/app/(admin)/ads/_components/ad-editor-modal.tsx

import { useState } from 'react';
import { api } from '@/lib';
import type { Ad } from '@/lib';
import { Button, useToast } from '@/components/ui';
import { Save, Loader2, Image as ImageIcon, Link2, Tag, Type } from 'lucide-react';

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

export default function AdEditorModal({ initialAd, onSuccess, onCancel }: AdEditorModalProps) {
  const { toast } = useToast();

  const [slotKey, setSlotKey] = useState<string>(initialAd?.slotKey || '');
  const [imageUrl, setImageUrl] = useState<string>(initialAd?.imageUrl || '');
  const [linkUrl, setLinkUrl] = useState<string>(initialAd?.linkUrl || '');
  const [altText, setAltText] = useState<string>(initialAd?.altText || '');
  const [isActive, setIsActive] = useState<boolean>(initialAd?.isActive ?? true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotKey.trim() || !imageUrl.trim() || !linkUrl.trim() || !altText.trim()) {
      toast({ type: 'error', message: 'Slot, image URL, link URL, and alt text are all required.' });
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
        <input
          type="text"
          list="known-slots"
          required
          placeholder="e.g. jobs-grid"
          value={slotKey}
          onChange={(e) => setSlotKey(e.target.value)}
          className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <datalist id="known-slots">
          {KNOWN_SLOTS.map((slot) => (
            <option key={slot} value={slot} />
          ))}
        </datalist>
        <p className="text-[11px] text-slate-400">
          Which page position this ad shows in. Multiple ads can target the same slot — the
          most recently updated active one wins.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
          <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
          <span>Image URL</span>
        </label>
        <input
          type="url"
          required
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        {imageUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 max-h-40 flex items-center justify-center">
            <img src={imageUrl} alt="Preview" referrerPolicy="no-referrer" className="max-h-40 object-contain" />
          </div>
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
        <Button type="submit" variant="primary" disabled={submitting} className="flex items-center space-x-1.5">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{initialAd ? 'Update Ad' : 'Create Ad'}</span>
        </Button>
      </div>
    </form>
  );
}
