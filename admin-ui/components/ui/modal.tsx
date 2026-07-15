'use client';

// admin-ui/components/ui/Modal.tsx
// Context-based modal system, adapted from cykruit-ui.

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { X, Trash2, CheckCircle2, Info } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalVariant = 'default' | 'danger' | 'success' | 'info';

export interface ModalOptions {
  title: string;
  description?: string;
  /** Custom body content — overrides description */
  content?: ReactNode;
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

// ─── Context ──────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
  return ctx;
}

// ─── Variant config ───────────────────────────────────────────────────────────

const VARIANT_CFG: Record<
  ModalVariant,
  { icon: ReactNode; iconBg: string; confirmBtn: string }
> = {
  default: {
    icon: null,
    iconBg: '',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  danger: {
    icon: <Trash2 className="h-5 w-5 text-red-600" />,
    iconBg: 'border border-red-100 bg-red-50',
    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    iconBg: 'border border-emerald-100 bg-emerald-50',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-600" />,
    iconBg: 'border border-blue-100 bg-blue-50',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
};

// ─── Dialog ───────────────────────────────────────────────────────────────────

function ModalDialog({
  state,
  onClose,
  onConfirmClick,
}: {
  state: ModalState;
  onClose: () => void;
  onConfirmClick: () => void;
}) {
  const variant = state.variant ?? 'default';
  const cfg = VARIANT_CFG[variant];

  useEffect(() => {
    if (!state.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state.open, onClose]);

  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close modal"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="p-6">
          {/* icon */}
          {cfg.icon && (
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${cfg.iconBg}`}
            >
              {cfg.icon}
            </div>
          )}

          <h2 className="pr-8 text-base font-bold leading-snug text-slate-900">
            {state.title}
          </h2>

          {/* body */}
          {state.content ? (
            <div className="mt-3">{state.content}</div>
          ) : state.description ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {state.description}
            </p>
          ) : null}

          {/* actions */}
          {(state.onConfirm || state.cancelLabel) && (
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                {state.cancelLabel ?? 'Cancel'}
              </button>
              {state.onConfirm && (
                <button
                  onClick={onConfirmClick}
                  disabled={state.loading}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${cfg.confirmBtn}`}
                >
                  {state.loading && (
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {state.confirmLabel ?? 'Confirm'}
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
  title: '',
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>(DEFAULT_STATE);

  const openModal = useCallback((options: ModalOptions) => {
    const scrollbarWidth =
      typeof window !== 'undefined'
        ? window.innerWidth - document.documentElement.clientWidth
        : 0;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    setState({ ...DEFAULT_STATE, ...options, open: true, loading: false });
  }, []);

  const closeModal = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    setTimeout(() => {
      setState(DEFAULT_STATE);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
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
