'use client';

// admin-ui/components/ui/combobox.tsx
// Free-text input with a portal-rendered, styled suggestion dropdown —
// replaces the native <input list>/<datalist> pair, which browsers render
// unstyled and can't be themed with CSS.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const DEFAULT_INPUT_CLASS =
  'w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600';

export default function Combobox({
  value,
  onChange,
  options,
  placeholder,
  required,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [style, setStyle] = useState<React.CSSProperties>({ display: 'none' });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

  const reposition = useCallback(() => {
    if (!wrapperRef.current) return;
    const r = wrapperRef.current.getBoundingClientRect();
    setStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9995 });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, reposition]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
    setActive(-1);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); commit(filtered[active]); }
    else if (e.key === 'Escape') { setOpen(false); setActive(-1); }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        className={className ?? DEFAULT_INPUT_CLASS}
      />

      {open && filtered.length > 0 && typeof document !== 'undefined' &&
        createPortal(
          <div
            style={style}
            className="bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-900/10 py-1 max-h-60 overflow-y-auto"
          >
            {filtered.map((option, idx) => (
              <button
                key={option}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); commit(option); }}
                onMouseEnter={() => setActive(idx)}
                className={`w-full text-left px-3 py-2 text-sm font-mono transition-colors ${
                  idx === active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
