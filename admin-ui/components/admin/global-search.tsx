'use client';

// admin-ui/components/admin/global-search.tsx
// Universal search: debounced query to GET /api/admin/search, grouped
// dropdown of top matches per entity, click or Enter to jump to the record.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import { NAV_ITEMS } from '@/lib/nav-items';
import {
  Search,
  X,
  Loader2,
  LayoutDashboard,
  Users,
  Briefcase,
  ShieldCheck,
  FileText,
  UserCheck,
  Quote,
  Newspaper,
  Megaphone,
  Mail,
  Ban,
  Sparkles,
  Shield,
  Tag,
  Layers,
  CreditCard,
  Image as ImageIcon,
  Calendar,
  Send,
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

interface SearchGroup {
  key: string;
  label: string;
  items: SearchResultItem[];
}

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pages: LayoutDashboard,
  users: Users,
  jobs: Briefcase,
  kyc: ShieldCheck,
  applications: FileText,
  resumes: UserCheck,
  admins: Shield,
  testimonials: Quote,
  blogs: Newspaper,
  announcements: Megaphone,
  contact: Mail,
  reports: Ban,
  blacklist: Ban,
  suggestions: Sparkles,
  roles: Tag,
  domains: Layers,
  subscriptions: CreditCard,
  ads: ImageIcon,
  events: Calendar,
  emails: Send,
};

export default function GlobalSearch() {
  const router = useRouter();
  const { has } = usePermissions();
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<{ query: string; groups: SearchGroup[] }>(
          `/api/admin/search?q=${encodeURIComponent(trimmed)}`,
        );
        setGroups(res.groups);
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Pages and their tabs are a small static list — matched client-side, no
  // API round-trip needed. Reuses the same NAV_ITEMS/`has()` gating as AdminSidebar.
  const pageGroup: SearchGroup | null = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;

    const items: SearchResultItem[] = [];
    for (const navItem of NAV_ITEMS) {
      const visible = Array.isArray(navItem.action) ? navItem.action.some(has) : has(navItem.action);
      if (!visible) continue;

      if (navItem.label.toLowerCase().includes(q)) {
        items.push({ id: navItem.href, title: navItem.label, subtitle: null, href: navItem.href });
      }
      for (const child of navItem.children ?? []) {
        if (child.label.toLowerCase().includes(q)) {
          items.push({
            id: `${navItem.href}?tab=${child.tab}`,
            title: child.label,
            subtitle: navItem.label,
            href: `${navItem.href}?tab=${child.tab}`,
          });
        }
      }
    }
    return items.length > 0 ? { key: 'pages', label: 'Pages', items: items.slice(0, 8) } : null;
  }, [query, has]);

  const allGroups = pageGroup ? [pageGroup, ...groups] : groups;
  const flatItems = allGroups.flatMap((g) => g.items.map((item) => ({ ...item, groupLabel: g.label })));

  function navigateTo(href: string) {
    setOpen(false);
    setQuery('');
    setGroups([]);
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      navigateTo(flatItems[activeIndex].href);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search users, jobs, admins…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {loading ? (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setGroups([]);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[28rem] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {loading && allGroups.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">Searching…</p>
          ) : flatItems.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">No results found.</p>
          ) : (
            allGroups.map((group) => {
              const Icon = GROUP_ICONS[group.key] ?? Search;
              return (
                <div key={group.key} className="mb-1 last:mb-0">
                  <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const flatIndex = flatItems.findIndex(
                      (f) => f.id === item.id && f.href === item.href,
                    );
                    const isActive = flatIndex === activeIndex;
                    return (
                      <button
                        key={`${group.key}-${item.id}`}
                        type="button"
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={() => navigateTo(item.href)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.title}</span>
                          {item.subtitle && (
                            <span className="block truncate text-xs text-slate-400">{item.subtitle}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
