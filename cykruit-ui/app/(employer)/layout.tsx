import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import { KycProvider, type KycStatus } from "@/lib/employer-context";

const AUTH_URL     = process.env.AUTH_SERVICE_URL     || "http://127.0.0.1:4001";
const EMPLOYER_URL = process.env.EMPLOYER_SERVICE_URL || "http://127.0.0.1:4004";

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
  try {
    const res = await fetch(`${AUTH_URL}/auth/me`, {
      headers: fwdHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

async function getKycData(fwdHeaders: Record<string, string>): Promise<{ status: KycStatus; rejectionReason?: string }> {
  if (!fwdHeaders.Cookie) return { status: "not_submitted" };
  try {
    const res = await fetch(`${EMPLOYER_URL}/employer/kyc/status`, {
      headers: fwdHeaders,
      cache: "no-store",
    });
    if (!res.ok) return { status: "not_submitted" };
    const body = await res.json();
    const data = body?.data ?? body;
    if (data?.isVerified) return { status: "verified" };
    const vs: string = data?.verification?.status ?? "";
    const rejectionReason: string | undefined = data?.verification?.rejectionReason ?? undefined;
    if (vs === "UNDER_REVIEW") return { status: "under_review" };
    if (vs === "PENDING")      return { status: "pending" };
    if (vs === "REJECTED")     return { status: "rejected", rejectionReason };
    return { status: "not_submitted" };
  } catch {
    return { status: "not_submitted" };
  }
}

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fwdHeaders = await buildForwardHeaders();

  const [user, kycData] = await Promise.all([
    getSessionUser(fwdHeaders),
    getKycData(fwdHeaders),
  ]);

  if (!user || user.role !== "EMPLOYER") {
    redirect("/login?next=/employer/dashboard");
  }

  return (
    <KycProvider initialStatus={kycData.status} initialRejectionReason={kycData.rejectionReason}>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <EmployerSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </KycProvider>
  );
}
