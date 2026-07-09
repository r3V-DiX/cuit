'use client';

// admin-ui/components/ui/RequirePermission.tsx
// Renders children only when the current admin holds the required permission.
// Elements without permission are REMOVED, not disabled (per UI/UX Brief §6).

import type { ReactNode } from 'react';
import { usePermissions } from '@/lib/permissions-context';

interface RequirePermissionProps {
  action: string;
  children: ReactNode;
  /** Optional fallback rendered when permission is missing (default: null). */
  fallback?: ReactNode;
}

export default function RequirePermission({
  action,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { has } = usePermissions();
  return has(action) ? <>{children}</> : <>{fallback}</>;
}
