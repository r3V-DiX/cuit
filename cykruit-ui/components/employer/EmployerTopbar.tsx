"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function EmployerTopbar({ title }: { title: string }) {
  const [hasUnread, setHasUnread] = useState(false);
  const [initials, setInitials] = useState("U");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await apiFetch<{ firstName?: string; lastName?: string; profileImage?: string }>("/api/auth/me");
        if (data) {
          const user = data;
          const first = user.firstName || "";
          const last = user.lastName || "";
          const init = (first[0] || "") + (last[0] || "");
          setInitials(init || "U");
          if (user.profileImage) {
            setProfileImage(user.profileImage);
          }
        }
      } catch (err) {
        // Fallback silently
      }

      try {
        const notifs = localStorage.getItem("cykruit_employer_notifications");
        if (notifs) {
          const parsed = JSON.parse(notifs);
          const count = parsed.filter((n: any) => !n.read).length;
          setHasUnread(count > 0);
        } else {
          setHasUnread(false);
        }
      } catch (err) {
        setHasUnread(false);
      }
    }
    loadUser();
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-semibold text-slate-900">{title}</h1>

      <div className="flex items-center gap-3">
        <Link
          href="/employer/notifications"
          className="relative w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {hasUnread && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />}
        </Link>

        <Link
          href="/employer/company"
          className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity overflow-hidden"
        >
          {profileImage ? (
            <img src={profileImage} alt="User Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">{initials}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
