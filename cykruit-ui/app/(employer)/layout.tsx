import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EmployerSidebar from "@/components/employer/EmployerSidebar";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://127.0.0.1:4001";

async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;

  try {
    const { headers: getHeaders } = await import("next/headers");
    const reqHeaders = await getHeaders();
    
    const forwardHeaders: Record<string, string> = {
      Cookie: `session_token=${sessionToken}`,
    };

    // Forward device fingerprint headers so backend doesn't revoke session due to mismatch
    const ua = reqHeaders.get("user-agent");
    if (ua) forwardHeaders["user-agent"] = ua;
    
    const al = reqHeaders.get("accept-language");
    if (al) forwardHeaders["accept-language"] = al;
    
    const ae = reqHeaders.get("accept-encoding");
    if (ae) forwardHeaders["accept-encoding"] = ae;
    
    const scu = reqHeaders.get("sec-ch-ua");
    if (scu) forwardHeaders["sec-ch-ua"] = scu;
    
    const scup = reqHeaders.get("sec-ch-ua-platform");
    if (scup) forwardHeaders["sec-ch-ua-platform"] = scup;
    
    const xff = reqHeaders.get("x-forwarded-for");
    if (xff) forwardHeaders["x-forwarded-for"] = xff;
    
    const xri = reqHeaders.get("x-real-ip");
    if (xri) forwardHeaders["x-real-ip"] = xri;

    const res = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: forwardHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user || user.role !== "EMPLOYER") {
    redirect("/login?next=/employer/dashboard");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <EmployerSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
