"use client";

// cykruit-ui/app/ads/[id]/page.tsx
// Legacy alias route redirecting directly to the new Spotlight Detail page.

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyAdRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/spotlight/${id}`);
    }
  }, [id, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
      <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      <p>Redirecting to Partner Spotlight…</p>
    </div>
  );
}
