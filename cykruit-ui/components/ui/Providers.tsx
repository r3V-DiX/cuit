"use client";

import { ToastProvider } from "./Toast";
import { ModalProvider } from "./Modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ModalProvider>{children}</ModalProvider>
    </ToastProvider>
  );
}
