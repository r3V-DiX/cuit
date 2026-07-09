'use client';

// admin-ui/lib/permissions-context.tsx
// PermissionsProvider: fetches GET /api/admin/me once after login,
// exposes usePermissions() → { has(action), isSuperAdmin, roles, user, refresh }.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { AdminMe } from './types';

interface PermissionsContextValue {
  user: AdminMe['user'] | null;
  roles: string[];
  isSuperAdmin: boolean;
  permissions: string[];
  loading: boolean;
  loaded: boolean;
  has: (action: string) => boolean;
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  user: null,
  roles: [],
  isSuperAdmin: false,
  permissions: [],
  loading: false,
  loaded: false,
  has: () => false,
  refresh: async () => {},
});

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}

interface PermissionsProviderProps {
  children: ReactNode;
  /** Pre-loaded data (e.g. after login). If provided, skips the initial fetch. */
  initialData?: AdminMe;
}

export function PermissionsProvider({
  children,
  initialData,
}: PermissionsProviderProps) {
  const [user, setUser] = useState<AdminMe['user'] | null>(
    initialData?.user ?? null,
  );
  const [roles, setRoles] = useState<string[]>(initialData?.roles ?? []);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(
    initialData?.isSuperAdmin ?? false,
  );
  const [permissions, setPermissions] = useState<string[]>(
    initialData?.permissions ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(!!initialData);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/me');
      if (!res.ok) {
        // 401 will be handled by the page-level logic; just clear state
        setUser(null);
        setRoles([]);
        setIsSuperAdmin(false);
        setPermissions([]);
        return;
      }
      const body = (await res.json()) as { success: boolean; data: AdminMe };
      if (body.success && body.data) {
        setUser(body.data.user);
        setRoles(body.data.roles);
        setIsSuperAdmin(body.data.isSuperAdmin);
        setPermissions(body.data.permissions);
      }
    } catch {
      // Network error — leave existing state
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!initialData && !loaded) {
      refresh();
    }
  }, [initialData, loaded, refresh]);

  const has = useCallback(
    (action: string): boolean => {
      if (isSuperAdmin) return true;
      return permissions.includes(action);
    },
    [isSuperAdmin, permissions],
  );

  return (
    <PermissionsContext.Provider
      value={{ user, roles, isSuperAdmin, permissions, loading, loaded, has, refresh }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}
