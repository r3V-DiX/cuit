"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield, Activity, LogOut, ChevronRight,
  Users, BarChart3, Lock, Briefcase, CreditCard, ShieldAlert,
} from "lucide-react";
import { apiFetch, authHeaders } from "@/lib/api";

const NAV = [
  { label: "Dashboard",      href: "/admin/dashboard",           icon: BarChart3,   exact: true },
  { label: "Users",          href: "/admin/users",               icon: Users        },
  { label: "KYC",            href: "/admin/kyc",                 icon: Shield       },
  { label: "Jobs",           href: "/admin/jobs",                icon: Briefcase    },
  { label: "Subscriptions",  href: "/admin/subscriptions",       icon: CreditCard   },
  { label: "Auth Logs",      href: "/admin/logs/auth",           icon: Lock         },
  { label: "System Logs",    href: "/admin/logs/system",         icon: Activity     },
  { label: "Admin Activity", href: "/admin/logs/admin-activity", icon: ShieldAlert  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ firstName: string; email: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((res) => {
        const u = res?.data;
        if (!u || u.role !== "ADMIN") {
          router.replace("/login");
          return;
        }
        setUser({ firstName: u.firstName, email: u.email });
      })
      .catch(() => router.replace("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  async function handleLogout() {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      headers: authHeaders(),
    }).catch(() => {});
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono">Verifying access...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-white font-mono font-semibold text-sm tracking-wider">CYKRUIT</span>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest">ADMIN</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-slate-300 font-medium truncate">{user?.firstName ?? "Admin"}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
