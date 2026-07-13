"use client";

import Link from "next/link";
import { ShieldAlert, Clock, ArrowRight } from "lucide-react";
import { useKycStatus } from "@/lib/employer-context";

function LockedScreen({ status }: { status: "not_submitted" | "pending" | "under_review" | "rejected" }) {
  const isPending = status === "pending" || status === "under_review";
  const isRejected = status === "rejected";

  return (
    <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
          {isPending
            ? <Clock className="w-8 h-8 text-blue-500" />
            : <ShieldAlert className="w-8 h-8 text-blue-500" />
          }
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isPending ? "Verification under review" : isRejected ? "Verification rejected" : "KYC verification required"}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            {isPending
              ? "Your documents are being reviewed. This section will unlock once your organisation is approved (1–2 business days)."
              : isRejected
              ? "Your KYC submission was rejected. Please resubmit with the correct documents to access this section."
              : "Complete your organisation verification to access this section and start using Cykruit's hiring tools."
            }
          </p>
        </div>
        {!isPending && (
          <Link
            href="/kyc/employer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            {isRejected ? "Resubmit KYC" : "Complete KYC"} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </main>
  );
}

export function KycGate({ children }: { children: React.ReactNode }) {
  const status = useKycStatus();
  if (status === "verified") return <>{children}</>;
  return <LockedScreen status={status} />;
}
