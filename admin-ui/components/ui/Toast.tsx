'use client';

// admin-ui/components/ui/Toast.tsx
// Context-based toast notification system, adapted from cykruit-ui.

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastPayload {
  type: ToastType;
  message: string;
  description?: string;
  /** ms, default 4000; 0 = persistent */
  duration?: number;
}

interface ToastItem extends ToastPayload {
  id: string;
}

interface ToastContextValue {
  toast: (payload: ToastPayload) => void;
  dismiss: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG: Record<
  ToastType,
  { icon: ReactNode; bar: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
    bar: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: <XCircle className="h-4 w-4 shrink-0" />,
    bar: 'bg-red-500',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
    bar: 'bg-amber-400',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: <Info className="h-4 w-4 shrink-0" />,
    bar: 'bg-blue-500',
    iconColor: 'text-blue-500',
  },
};

// ─── Single Toast ──────────────────────────────────────────────────────────────

function SingleToast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const cfg = CONFIG[item.type];
  const duration = item.duration ?? 4000;
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 300);
  }, [item.id, onDismiss]);

  useEffect(() => {
    if (duration === 0) return;
    timerRef.current = setTimeout(dismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, dismiss]);

  return (
    <div
      className={`relative flex w-[340px] items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white py-3 pr-3 pl-4 shadow-lg shadow-slate-200/80 transition-all duration-300 ${
        exiting ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      {/* left accent bar */}
      <div className={`absolute top-0 bottom-0 left-0 w-0.5 rounded-l-xl ${cfg.bar}`} />

      {/* icon */}
      <span className={`mt-0.5 ${cfg.iconColor}`}>{cfg.icon}</span>

      {/* content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-slate-900">
          {item.message}
        </p>
        {item.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {item.description}
          </p>
        )}
      </div>

      {/* dismiss */}
      <button
        onClick={dismiss}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* progress bar */}
      {duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} opacity-30`}
          style={{ animation: `toast-shrink ${duration}ms linear forwards` }}
        />
      )}
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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
      <div className="pointer-events-none fixed right-6 bottom-6 z-[9999] flex flex-col items-end gap-3">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <SingleToast item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
