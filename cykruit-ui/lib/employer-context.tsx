"use client";

import { createContext, useContext } from "react";

export type KycStatus =
  | "verified"
  | "under_review"
  | "pending"
  | "rejected"
  | "not_submitted";

export type EmployerMemberRole = "OWNER" | "HIRING_MANAGER" | "RECRUITER" | "VIEWER";

export interface KycContextValue {
  status: KycStatus;
  rejectionReason?: string;
  employerRole: EmployerMemberRole | null;
}

const KycContext = createContext<KycContextValue>({ status: "not_submitted", employerRole: null });

export function KycProvider({
  children,
  initialStatus,
  initialRejectionReason,
  initialEmployerRole,
}: {
  children: React.ReactNode;
  initialStatus: KycStatus;
  initialRejectionReason?: string;
  initialEmployerRole?: EmployerMemberRole | null;
}) {
  return (
    <KycContext.Provider value={{
      status: initialStatus,
      rejectionReason: initialRejectionReason,
      employerRole: initialEmployerRole ?? null,
    }}>
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

export function useEmployerRole(): EmployerMemberRole | null {
  return useContext(KycContext).employerRole;
}
