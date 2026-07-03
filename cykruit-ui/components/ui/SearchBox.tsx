"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, ArrowRight, X } from "lucide-react";
import { jobs } from "@/lib/jobs-data";

// ── Suggestion index ───────────────────────────────────────────────────────
type Suggestion = { text: string; type: "Role" | "Company" | "Skill" };

const ALL_SUGGESTIONS: Suggestion[] = [
  ...[...new Set(jobs.map((j) => j.title))].map((t)  => ({ text: t, type: "Role"    as const })),
  ...[...new Set(jobs.map((j) => j.company))].map((c) => ({ text: c, type: "Company" as const })),
  ...[...new Set(jobs.flatMap((j) => j.tags))].map((s) => ({ text: s, type: "Skill"  as const })),
];

const TYPE_STYLE: Record<Suggestion["type"], string> = {
  Role:    "bg-blue-50 text-blue-600 border-blue-200",
  Company: "bg-violet-50 text-violet-600 border-violet-200",
  Skill:   "bg-slate-100 text-slate-500 border-slate-200",
};

function getSuggestions(query: string): Suggestion[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return ALL_SUGGESTIONS.filter((s) => s.text.toLowerCase().includes(q)).slice(0, 6);
}

// ── Portal dropdown ────────────────────────────────────────────────────────
function DropdownPortal({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({ display: "none" });

  const reposition = useCallback(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setStyle({
      position: "fixed",
      top: r.bottom + 6,
      left: r.left,
      width: r.width,
      zIndex: 99999,
    });
  }, [anchorRef]);

  useEffect(() => {
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [reposition]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div style={style}>{children}</div>,
    document.body
  );
}

// ── SearchBox ──────────────────────────────────────────────────────────────
type Props = {
  defaultValue?: string;
  placeholder?: string;
  onSearch: (value: string) => void;
  size?: "md" | "lg";
  className?: string;
};

export default function SearchBox({
  defaultValue = "",
  placeholder = "Search roles, skills, companies…",
  onSearch,
  size = "md",
  className = "",
}: Props) {
  const [value, setValue]   = useState(defaultValue);
  const [open, setOpen]     = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setValue(defaultValue); }, [defaultValue]);

  const suggestions = getSuggestions(value);

  const commit = useCallback((v: string) => {
    setValue(v);
    setOpen(false);
    setActive(-1);
    onSearch(v);
  }, [onSearch]);

  const clear = useCallback(() => {
    setValue("");
    setOpen(false);
    setActive(-1);
    onSearch("");
  }, [onSearch]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        // Also check if click is inside the portal dropdown
        const portal = document.getElementById("searchbox-portal");
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleKey(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") { e.preventDefault(); commit(value); }
      return;
    }
    if (e.key === "ArrowDown")  { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter")     { e.preventDefault(); active >= 0 ? commit(suggestions[active].text) : commit(value); }
    else if (e.key === "Escape")    { setOpen(false); setActive(-1); }
  }

  const isLg = size === "lg";

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      {/* Input bar */}
      <div className={`flex items-center gap-2 bg-white rounded-2xl border transition-all ${
        open ? "border-blue-400 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10" : "border-slate-200 shadow-sm"
      } ${isLg ? "p-2" : "p-1.5"}`}>

        <div className={`flex items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shrink-0 ${isLg ? "w-10 h-10" : "w-9 h-9"}`}>
          <Search className={`${isLg ? "w-5 h-5" : "w-4 h-4"} text-blue-500`} />
        </div>

        <input
          value={value}
          placeholder={placeholder}
          className={`flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none ${isLg ? "py-3.5" : "py-2.5"} pr-1`}
          onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => { if (value) setOpen(true); }}
          onKeyDown={handleKey}
        />

        {value && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center justify-center w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {isLg && <div className="w-px h-6 bg-slate-200 shrink-0" />}

        <button
          type="button"
          onClick={() => commit(value)}
          className={`flex items-center gap-1.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 shrink-0 ${isLg ? "px-6 py-3" : "px-5 py-2.5"}`}
        >
          {isLg ? <>Find Jobs <ArrowRight className="w-3.5 h-3.5" /></> : "Search"}
        </button>
      </div>

      {/* Portal dropdown — rendered at body, repositions on scroll/resize */}
      {open && suggestions.length > 0 && (
        <DropdownPortal anchorRef={boxRef}>
          <div
            id="searchbox-portal"
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/12 py-1.5 overflow-hidden"
          >
            {suggestions.map((s, idx) => {
              const isActive = idx === active;
              const parts = s.text.split(new RegExp(`(${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
              return (
                <button
                  key={s.text + s.type}
                  onMouseDown={(e) => { e.preventDefault(); commit(s.text); }}
                  onMouseEnter={() => setActive(idx)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isActive ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className={`flex-1 text-sm truncate ${isActive ? "text-blue-700" : "text-slate-700"}`}>
                    {parts.map((part, i) =>
                      part.toLowerCase() === value.toLowerCase()
                        ? <mark key={i} className="bg-blue-100 text-blue-700 font-semibold rounded-sm px-0.5 not-italic">{part}</mark>
                        : part
                    )}
                  </span>
                  <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md border shrink-0 ${TYPE_STYLE[s.type]}`}>
                    {s.type}
                  </span>
                </button>
              );
            })}

            <div className="border-t border-slate-100 mx-3 mt-1 pt-1 pb-0.5">
              <button
                onMouseDown={(e) => { e.preventDefault(); commit(value); }}
                className="w-full text-left flex items-center gap-2 px-1 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Search for &ldquo;{value}&rdquo;
              </button>
            </div>
          </div>
        </DropdownPortal>
      )}
    </div>
  );
}
