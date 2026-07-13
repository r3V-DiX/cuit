"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, Clock, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

type KycStatus = "loading" | "verified" | "pending" | "not_submitted";

interface KycGateProps {
  children: React.ReactNode;
}

function useKycStatus(): KycStatus {
  const [status, setStatus] = useState<KycStatus>("loading");

  useEffect(() => {
    apiFetch("/api/employer/kyc/status")
      .then((res) => {
        if (res.data?.isVerified) { setStatus("verified"); return; }
        const vs = res.data?.verification?.status;
        if (vs === "PENDING" || vs === "UNDER_REVIEW") setStatus("pending");
        else setStatus("not_submitted");
      })
      .catch(() => setStatus("not_submitted"));
  }, []);

  return status;
}

function LockedScreen({ pending }: { pending: boolean }) {
  return (
    <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-5">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
          pending ? "bg-blue-50 border-2 border-blue-200" : "bg-amber-50 border-2 border-amber-200"
        }`}>
          {pending
            ? <Clock className="w-8 h-8 text-blue-500" />
            : <ShieldAlert className="w-8 h-8 text-amber-500" />
          }
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {pending ? "Verification under review" : "KYC verification required"}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            {pending
              ? "Your documents are being reviewed. This section will unlock once your organisation is approved (1–2 business days)."
              : "Complete your organisation verification to access this section and start using Cykruit's hiring tools."
            }
          </p>
        </div>
        {!pending && (
          <Link
            href="/kyc/employer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm shadow-amber-500/20"
          >
            Complete KYC <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </main>
  );
}

export function KycGate({ children }: KycGateProps) {
  const status = useKycStatus();

  if (status === "loading") return null;
  if (status === "not_submitted") return <LockedScreen pending={false} />;
  if (status === "pending") return <LockedScreen pending={true} />;
  return <>{children}</>;
}
