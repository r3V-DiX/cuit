export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import { KycProvider, type KycStatus, type EmployerMemberRole } from "@/lib/employer-context";
import { SubscriptionBanner } from "@/components/employer/SubscriptionBanner";
import { AnnouncementBanner, type AnnouncementItem } from "@/components/ui/AnnouncementBanner";
import { SessionGuardMount } from "@/components/auth/SessionGuardMount";

const AUTH_URL         = process.env.AUTH_SERVICE_URL         || "http://127.0.0.1:4001";
const EMPLOYER_URL     = process.env.EMPLOYER_SERVICE_URL     || "http://127.0.0.1:4004";
const SUBSCRIPTION_URL = process.env.SUBSCRIPTION_SERVICE_URL || "http://127.0.0.1:4007";
const PUBLIC_URL       = process.env.PUBLIC_SERVICE_URL       || "http://127.0.0.1:4006";

async function buildForwardHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return {};

  const { headers: getHeaders } = await import("next/headers");
  const reqHeaders = await getHeaders();

  const fwd: Record<string, string> = {
    Cookie: `session_token=${sessionToken}`,
  };
  const copy = ["user-agent", "accept-language", "accept-encoding",
    "sec-ch-ua", "sec-ch-ua-platform", "x-forwarded-for", "x-real-ip"];
  for (const h of copy) {
    const v = reqHeaders.get(h);
    if (v) fwd[h] = v;
  }
  return fwd;
}

async function getSessionUser(fwdHeaders: Record<string, string>) {
  if (!fwdHeaders.Cookie) return null;
  const urls = Array.from(new Set([AUTH_URL, "http://auth-service:4001", "http://gateway:5000", "http://127.0.0.1:4001"]));
  for (const baseUrl of urls) {
    try {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: fwdHeaders,
        cache: "no-store",
      });
      if (res.ok) {
        const body = await res.json();
        return body?.data ?? null;
      }
    } catch {
      // try next fallback URL
    }
  }
  return null;
}

async function getSubscriptionStatus(
  fwdHeaders: Record<string, string>
): Promise<{ status: string | null; planName: string | null } | null> {
  if (!fwdHeaders.Cookie) return null;
  const urls = Array.from(new Set([SUBSCRIPTION_URL, "http://subscription-service:4008", "http://gateway:5000", "http://127.0.0.1:4008"]));
  for (const baseUrl of urls) {
    try {
      const res = await fetch(`${baseUrl}/subscriptions/my`, {
        headers: fwdHeaders,
        cache: "no-store",
      });
      if (res.ok) {
        const body = await res.json();
        const data = body?.data ?? body;
        // Use the server-computed display status: a cancel-at-period-end plan keeps raw
        // status ACTIVE but must still surface the "cancelled" banner.
        return {
          status: data?.effectiveStatus ?? data?.status ?? null,
          planName: data?.package?.name ?? null,
        };
      }
    } catch {
      // try next fallback URL
    }
  }
  return null;
}

async function getAnnouncements(): Promise<AnnouncementItem[]> {
  try {
    const res = await fetch(`${PUBLIC_URL}/public/announcements?target=EMPLOYER`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body?.data ?? body ?? [];
  } catch {
    return [];
  }
}

async function getMemberRole(fwdHeaders: Record<string, string>): Promise<EmployerMemberRole | null> {
  if (!fwdHeaders.Cookie) return null;
  const urls = Array.from(new Set([EMPLOYER_URL, "http://employer-service:4004", "http://gateway:5000", "http://127.0.0.1:4004"]));
  for (const baseUrl of urls) {
    try {
      const res = await fetch(`${baseUrl}/employer/team/my-role`, {
        headers: fwdHeaders,
        cache: "no-store",
      });
      if (res.ok) {
        const body = await res.json();
        const role = body?.data?.role ?? null;
        return role as EmployerMemberRole | null;
      }
    } catch {
      // try next fallback URL
    }
  }
  return null;
}

async function getKycData(fwdHeaders: Record<string, string>): Promise<{ status: KycStatus; rejectionReason?: string }> {
  if (!fwdHeaders.Cookie) return { status: "not_submitted" };
  const urls = Array.from(new Set([EMPLOYER_URL, "http://employer-service:4004", "http://gateway:5000", "http://127.0.0.1:4004"]));
  for (const baseUrl of urls) {
    try {
      const res = await fetch(`${baseUrl}/employer/kyc/status`, {
        headers: fwdHeaders,
        cache: "no-store",
      });
      if (res.ok) {
        const body = await res.json();
        const data = body?.data ?? body;
        if (data?.isVerified) return { status: "verified" };
        const vs: string = data?.verification?.status ?? "";
        const rejectionReason: string | undefined = data?.verification?.rejectionReason ?? undefined;
        if (vs === "UNDER_REVIEW") return { status: "under_review" };
        if (vs === "PENDING")      return { status: "pending" };
        if (vs === "REJECTED")     return { status: "rejected", rejectionReason };
        return { status: "not_submitted" };
      }
    } catch {
      // try next fallback URL
    }
  }
  return { status: "not_submitted" };
}

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fwdHeaders = await buildForwardHeaders();
  const user = await getSessionUser(fwdHeaders);

  if (!user || user.role !== "EMPLOYER") {
    redirect("/login?next=/employer/dashboard");
  }

  const [kycData, subscriptionInfo, announcements, memberRole] = await Promise.all([
    getKycData(fwdHeaders),
    getSubscriptionStatus(fwdHeaders),
    getAnnouncements(),
    getMemberRole(fwdHeaders),
  ]);

  const subscriptionStatus = subscriptionInfo?.status ?? null;
  const isExpired = subscriptionStatus === "EXPIRED" || subscriptionStatus === "CANCELLED";

  return (
    <KycProvider initialStatus={kycData.status} initialRejectionReason={kycData.rejectionReason} initialEmployerRole={memberRole}>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <SessionGuardMount />
        <EmployerSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AnnouncementBanner announcements={announcements} />
          {isExpired && (
            <SubscriptionBanner
              status={subscriptionStatus!}
              planName={subscriptionInfo?.planName ?? undefined}
            />
          )}
          {children}
        </div>
      </div>
    </KycProvider>
  );
}
