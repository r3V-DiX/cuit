'use client';

// admin-ui/app/(admin)/events/[id]/edit/page.tsx
// Full-Screen Dedicated Event Editor Page

import { useState, useEffect, use } from 'react';
import { api } from '@/lib';
import type { Event as WhatsNewEvent } from '@/lib';
import FullScreenEventEditor from '../../_components/full-screen-event-editor';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [event, setEvent] = useState<WhatsNewEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await api.get<WhatsNewEvent>(`/api/admin/events/${id}`);
        setEvent(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-6 bg-white rounded-2xl border border-red-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Unable to load event</h3>
        <p className="text-xs text-slate-500">{error || 'Event not found.'}</p>
        <Link
          href="/events"
          className="inline-block px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
        >
          Return to Events List
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <FullScreenEventEditor initialEvent={event} eventId={id} />
    </div>
  );
}
