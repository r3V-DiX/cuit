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
    const res = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: { Cookie: `session_token=${sessionToken}` },
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
