"use client";

import { createContext, useContext } from "react";

export type KycStatus =
  | "verified"
  | "under_review"
  | "pending"
  | "rejected"
  | "not_submitted";

const KycContext = createContext<KycStatus>("not_submitted");

export function KycProvider({
  children,
  initialStatus,
}: {
  children: React.ReactNode;
  initialStatus: KycStatus;
}) {
  return (
    <KycContext.Provider value={initialStatus}>{children}</KycContext.Provider>
  );
}

export function useKycStatus(): KycStatus {
  return useContext(KycContext);
}
