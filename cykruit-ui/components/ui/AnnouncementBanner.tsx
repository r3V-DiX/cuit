"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info, AlertCircle, X } from "lucide-react";

export interface AnnouncementItem {
  id: string;
  message: string;
  type: "info" | "warning" | "critical";
}

interface Props {
  announcements: AnnouncementItem[];
}

const DISMISSED_KEY = "cykruit_dismissed_announcements";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

const STYLES: Record<AnnouncementItem["type"], { wrapper: string; icon: React.ReactNode }> = {
  info: {
    wrapper: "bg-blue-50 border-blue-200 text-blue-800",
    icon: <Info className="h-4 w-4 shrink-0 text-blue-500" />,
  },
  warning: {
    wrapper: "bg-amber-50 border-amber-200 text-amber-800",
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />,
  },
  critical: {
    wrapper: "bg-red-50 border-red-200 text-red-800",
    icon: <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />,
  },
};

export function AnnouncementBanner({ announcements }: Props) {
  const [dismissed, setDismissed] = useState<string[] | null>(null);

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  if (dismissed === null) return null;

  const visible = announcements.find((a) => !dismissed.includes(a.id));
  if (!visible) return null;

  const style = STYLES[visible.type];

  function dismiss() {
    const next = [...(dismissed ?? []), visible!.id];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable — dismissal just won't persist across reloads
    }
  }

  return (
    <div className={`flex items-center gap-3 border-b px-5 py-2.5 text-sm ${style.wrapper}`}>
      {style.icon}
      <span className="flex-1">{visible.message}</span>
      <button
        onClick={dismiss}
        className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
