"use client";

import { ToastProvider } from "./Toast";
import { ModalProvider } from "./Modal";

export function Providers({ children, nonce: _nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <ToastProvider>
      <ModalProvider>{children}</ModalProvider>
    </ToastProvider>
  );
}
