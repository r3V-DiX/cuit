export const dynamic = "force-dynamic";

import SeekerSidebar from "@/components/seeker/SeekerSidebar";
import { AnnouncementBanner, type AnnouncementItem } from "@/components/ui/AnnouncementBanner";
import { SessionGuardMount } from "@/components/auth/SessionGuardMount";

const PUBLIC_URL = process.env.PUBLIC_SERVICE_URL || "http://127.0.0.1:4006";

async function getAnnouncements(): Promise<AnnouncementItem[]> {
  try {
    const res = await fetch(`${PUBLIC_URL}/public/announcements?target=SEEKER`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body?.data ?? body ?? [];
  } catch {
    return [];
  }
}

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const announcements = await getAnnouncements();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <SessionGuardMount />
      <SeekerSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AnnouncementBanner announcements={announcements} />
        {children}
      </div>
    </div>
  );
}
