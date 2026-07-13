"use client";

import { createContext, useContext, useCallback, useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ModalVariant = "default" | "danger" | "success" | "info";

export interface ModalOptions {
  title: string;
  description?: string;
  content?: React.ReactNode; // custom body (overrides description)
  variant?: ModalVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ModalState extends ModalOptions {
  open: boolean;
  loading: boolean;
}

interface ModalContextValue {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}

// ─── Variant config ──────────────────────────────────────────────────────────

const VARIANT_CFG: Record<ModalVariant, {
  icon: React.ReactNode;
  iconBg: string;
  confirmBtn: string;
}> = {
  default: {
    icon: null,
    iconBg: "",
    confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  danger: {
    icon: <Trash2 className="w-5 h-5 text-red-600" />,
    iconBg: "bg-red-50 border border-red-100",
    confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
  },
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    iconBg: "bg-emerald-50 border border-emerald-100",
    confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-600" />,
    iconBg: "bg-blue-50 border border-blue-100",
    confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
  },
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalDialog({
  state,
  onClose,
  onConfirmClick,
}: {
  state: ModalState;
  onClose: () => void;
  onConfirmClick: () => void;
}) {
  const variant = state.variant ?? "default";
  const cfg = VARIANT_CFG[variant];

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[9990] flex items-center justify-center p-4 transition-opacity duration-200 ${
        state.open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 transition-all duration-200 ${
          state.open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="p-6">
          {/* icon + title */}
          {cfg.icon && (
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${cfg.iconBg}`}>
              {cfg.icon}
            </div>
          )}

          <h2 className="text-base font-bold text-slate-900 pr-8 leading-snug">{state.title}</h2>

          {/* body */}
          {state.content ? (
            <div className="mt-3">{state.content}</div>
          ) : state.description ? (
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{state.description}</p>
          ) : null}

          {/* actions */}
          {(state.onConfirm || state.cancelLabel) && (
            <div className="mt-6 flex gap-2.5 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {state.cancelLabel ?? "Cancel"}
              </button>
              {state.onConfirm && (
                <button
                  onClick={onConfirmClick}
                  disabled={state.loading}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60 ${cfg.confirmBtn}`}
                >
                  {state.loading && (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {state.confirmLabel ?? "Confirm"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const DEFAULT_STATE: ModalState = {
  open: false,
  loading: false,
  title: "",
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState>(DEFAULT_STATE);

  const openModal = useCallback((options: ModalOptions) => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    setState({ ...DEFAULT_STATE, ...options, open: true, loading: false });
  }, []);

  const closeModal = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    setTimeout(() => {
      setState(DEFAULT_STATE);
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
    }, 250);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!state.onConfirm) return;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await state.onConfirm();
    } finally {
      closeModal();
    }
  }, [state, closeModal]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <ModalDialog state={state} onClose={closeModal} onConfirmClick={handleConfirm} />
    </ModalContext.Provider>
  );
}
