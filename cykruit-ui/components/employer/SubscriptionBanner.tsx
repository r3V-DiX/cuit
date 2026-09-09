"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface Props {
  status: string;
  planName?: string;
}

export function SubscriptionBanner({ status, planName }: Props) {
  const isExpired = status === "EXPIRED";
  const planPrefix = planName ? `Your ${planName} subscription` : "Your subscription";
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
      <span>
        {isExpired
          ? `${planPrefix} has expired and your account has reverted to the Free tier. Job posting and team limits now apply.`
          : `${planPrefix} has been cancelled. You'll keep access until the end of your current billing period.`}
      </span>
      <Link
        href={isExpired ? "/employer/subscription?tab=plans" : "/employer/subscription"}
        className="ml-auto shrink-0 font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700 whitespace-nowrap"
      >
        {isExpired ? "Upgrade Plan" : "Manage Plan"}
      </Link>
    </div>
  );
}
