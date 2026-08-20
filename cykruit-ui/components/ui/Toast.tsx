"use client";

import { createContext, useContext, useCallback, useState, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useInlineStyle } from "@/lib/use-inline-style";

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

export interface ToastPayload {
  type: ToastType;
  message: string;
  description?: string;
  duration?: number; // ms, default 4000; 0 = persistent
}

interface Toast extends ToastPayload {
  id: string;
}

interface ToastContextValue {
  toast: (payload: ToastPayload) => void;
  dismiss: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG: Record<ToastType, { icon: React.ReactNode; bar: string; iconColor: string; bg: string; border: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />,
    bar: "bg-emerald-500",
    iconColor: "text-emerald-500",
    bg: "bg-white",
    border: "border-slate-200",
  },
  error: {
    icon: <XCircle className="w-4.5 h-4.5 shrink-0" />,
    bar: "bg-red-500",
    iconColor: "text-red-500",
    bg: "bg-white",
    border: "border-slate-200",
  },
  warning: {
    icon: <AlertTriangle className="w-4.5 h-4.5 shrink-0" />,
    bar: "bg-amber-400",
    iconColor: "text-amber-500",
    bg: "bg-white",
    border: "border-slate-200",
  },
  info: {
    icon: <Info className="w-4.5 h-4.5 shrink-0" />,
    bar: "bg-blue-500",
    iconColor: "text-blue-500",
    bg: "bg-white",
    border: "border-slate-200",
  },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const cfg = CONFIG[toast.type];
  const duration = toast.duration ?? 4000;
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRef = useInlineStyle<HTMLDivElement>({
    animation: duration > 0 ? `toast-shrink ${duration}ms linear forwards` : undefined,
  });

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    if (duration === 0) return;
    timerRef.current = setTimeout(dismiss, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [duration, dismiss]);

  return (
    <div
      className={`
        relative flex items-start gap-3 w-[340px] rounded-xl border shadow-lg shadow-slate-200/80
        pr-3 pt-3 pb-3 pl-4 overflow-hidden
        transition-all duration-300
        ${exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}
        ${cfg.bg} ${cfg.border}
      `}
    >
      {/* left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.75 rounded-l-xl ${cfg.bar}`} />

      {/* icon */}
      <span className={`mt-0.5 ${cfg.iconColor}`}>{cfg.icon}</span>

      {/* content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 leading-tight">{toast.message}</p>
        {toast.description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>

      {/* dismiss */}
      <button
        onClick={dismiss}
        className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* progress bar (only when timed) */}
      {duration > 0 && (
        <div
          ref={progressBarRef}
          className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} opacity-30`}
        />
      )}
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((payload: ToastPayload) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...payload, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Portal: bottom-right stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
