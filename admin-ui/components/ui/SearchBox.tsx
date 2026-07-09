'use client';

// admin-ui/components/ui/SearchBox.tsx
// A standalone search box that updates URL params for debounced searching.

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

interface SearchBoxProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
}

export default function SearchBox({
  placeholder = 'Search...',
  paramName = 'q',
  className = '',
}: SearchBoxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const initialValue = searchParams.get(paramName) ?? '';
  const [value, setValue] = useState(initialValue);

  // Sync value from URL if it changes externally
  useEffect(() => {
    setValue(searchParams.get(paramName) ?? '');
  }, [searchParams, paramName]);

  // Debounced update to URL
  useEffect(() => {
    if (value === initialValue) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set(paramName, value.trim());
      } else {
        params.delete(paramName);
      }
      // Reset pagination when searching
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(handler);
  }, [value, initialValue, paramName, pathname, router, searchParams]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-9 font-mono text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 hover:border-slate-300"
      />
    </div>
  );
}
