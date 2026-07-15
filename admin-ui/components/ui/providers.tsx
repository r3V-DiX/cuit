'use client';

// admin-ui/components/ui/Providers.tsx
// Root providers for admin-ui — wraps the entire app in layout.tsx.
// PermissionsProvider is NOT here; it lives in (admin)/layout.tsx because
// only authenticated admin pages need permissions context.

import { ToastProvider } from './Toast';
import { ModalProvider } from './Modal';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ModalProvider>{children}</ModalProvider>
    </ToastProvider>
  );
}
