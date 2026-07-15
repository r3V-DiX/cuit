"use client";

import { createContext, useContext } from "react";

export type KycStatus =
  | "verified"
  | "under_review"
  | "pending"
  | "rejected"
  | "not_submitted";

export interface KycContextValue {
  status: KycStatus;
  rejectionReason?: string;
}

const KycContext = createContext<KycContextValue>({ status: "not_submitted" });

export function KycProvider({
  children,
  initialStatus,
  initialRejectionReason,
}: {
  children: React.ReactNode;
  initialStatus: KycStatus;
  initialRejectionReason?: string;
}) {
  return (
    <KycContext.Provider value={{ status: initialStatus, rejectionReason: initialRejectionReason }}>
      {children}
    </KycContext.Provider>
  );
}

export function useKycStatus(): KycStatus {
  return useContext(KycContext).status;
}

export function useKycContext(): KycContextValue {
  return useContext(KycContext);
}
