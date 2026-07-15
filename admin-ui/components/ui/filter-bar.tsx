'use client';

// admin-ui/components/ui/FilterBar.tsx
// Horizontal filter row with select pills and optional search box.
// Syncs to URL query params (shareable/deep-linkable).

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useCallback } from 'react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface SortConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  searchKey?: string;
  searchPlaceholder?: string;
  /** Optional from/to date inputs — pass URL param keys to enable. */
  dateRange?: { fromKey: string; toKey: string };
  /** Optional sort-order select, rendered as another pill. */
  sort?: SortConfig;
}

export default function FilterBar({
  filters,
  searchKey = 'q',
  searchPlaceholder = 'Search…',
  dateRange,
  sort,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on filter change
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasActiveFilters =
    filters.some((f) => searchParams.get(f.key)) ||
    !!searchParams.get(searchKey) ||
    (!!dateRange && (!!searchParams.get(dateRange.fromKey) || !!searchParams.get(dateRange.toKey))) ||
    (!!sort && !!searchParams.get(sort.key));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Select filters */}
      {filters.map((filter) => {
        const value = searchParams.get(filter.key) ?? '';
        return (
          <select
            key={filter.key}
            id={`filter-${filter.key}`}
            value={value}
            onChange={(e) => updateParam(filter.key, e.target.value)}
            className={`h-9 rounded-xl border px-3 font-mono text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              value
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      })}

      {/* Sort */}
      {sort && (
        <select
          id={`filter-${sort.key}`}
          value={searchParams.get(sort.key) ?? ''}
          onChange={(e) => updateParam(sort.key, e.target.value)}
          className={`h-9 rounded-xl border px-3 font-mono text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            searchParams.get(sort.key)
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <option value="">{sort.label}</option>
          {sort.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Date range */}
      {dateRange && (
        <div className="flex items-center gap-1.5">
          <input
            id={`filter-${dateRange.fromKey}`}
            type="date"
            value={searchParams.get(dateRange.fromKey) ?? ''}
            onChange={(e) => updateParam(dateRange.fromKey, e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs text-slate-600 transition-colors focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            id={`filter-${dateRange.toKey}`}
            type="date"
            value={searchParams.get(dateRange.toKey) ?? ''}
            onChange={(e) => updateParam(dateRange.toKey, e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs text-slate-600 transition-colors focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300"
          />
        </div>
      )}

      {/* Search */}
      {searchKey && (
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            id={`filter-${searchKey}`}
            type="text"
            placeholder={searchPlaceholder}
            value={searchParams.get(searchKey) ?? ''}
            onChange={(e) => updateParam(searchKey, e.target.value)}
            className="h-9 w-56 rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-8 font-mono text-xs text-slate-700 placeholder-slate-400 transition-colors focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300"
          />
        </div>
      )}

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
