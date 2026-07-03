"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export default function EmployerTopbar({ title }: { title: string }) {
  const hasUnread = true;
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
          className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
        >
          {/* TODO: derive from session */}
          <span className="text-xs font-bold text-white">CS</span>
        </Link>
      </div>
    </header>
  );
}
