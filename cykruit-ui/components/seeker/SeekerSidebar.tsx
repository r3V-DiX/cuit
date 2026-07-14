"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, User, FileText, Bookmark, Settings,
  Shield, ChevronLeft, ChevronRight, LogOut, Bell, MessageSquare,
  Menu, X,
} from "lucide-react";
import { useModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders } from "@/lib/api";
import { broadcastLogout, subscribeAuthSync } from "@/lib/auth-sync";

const navItems = [
  { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard },
  { label: "Profile",       href: "/profile",       icon: User            },
  { label: "Applications",  href: "/applications",  icon: FileText        },
  { label: "Saved Jobs",    href: "/saved",         icon: Bookmark        },
  { label: "Messages",      href: "/messages",      icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings",      href: "/settings",      icon: Settings       },
];

export default function SeekerSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { openModal } = useModal();
  const { toast } = useToast();

  useEffect(() => {
    function updateCounts() {
      try {
        const msgs = localStorage.getItem("cykruit_messages");
        if (msgs) {
          const parsed = JSON.parse(msgs);
          const count = parsed.reduce((sum: number, c: any) => sum + (c.seekerUnread || 0), 0);
          setUnreadMsgs(count);
        } else {
          setUnreadMsgs(0);
        }
      } catch (e) {
        setUnreadMsgs(0);
      }

      try {
        const notifs = localStorage.getItem("cykruit_notifications");
        if (notifs) {
          const parsed = JSON.parse(notifs);
          const count = parsed.filter((n: any) => !n.read).length;
          setUnreadNotifs(count);
        } else {
          setUnreadNotifs(0);
        }
      } catch (e) {
        setUnreadNotifs(0);
      }
    }

    async function fetchLatestConversations() {
      try {
        const res = await apiFetch<unknown[] | { items?: unknown[] }>("/api/conversations");
        const items = Array.isArray(res?.data) ? res.data : ((res?.data as { items?: unknown[] })?.items ?? []);
        // Save to localStorage so updateCounts picks it up
        if (items.length > 0) {
          localStorage.setItem("cykruit_messages", JSON.stringify(items));
          updateCounts();
        }
      } catch (e) {
        // silently ignore fetch errors
      }
    }

    // Initial fetch and start intervals
    updateCounts();
    fetchLatestConversations();
    
    const countInterval = setInterval(updateCounts, 2000);
    const fetchInterval = setInterval(fetchLatestConversations, 15000); // Poll every 15s

    return () => {
      clearInterval(countInterval);
      clearInterval(fetchInterval);
    };
  }, []);

  useEffect(() => {
    return subscribeAuthSync(
      () => router.push("/login"),
      () => {},
    );
  }, [router]);

  function handleSignOut() {
    openModal({
      variant: "danger",
      title: "Sign out?",
      description: "You'll need to sign back in to access your account.",
      confirmLabel: "Sign out",
      onConfirm: async () => {
        try {
          await apiFetch("/api/auth/logout", {
            method: "POST",
            headers: authHeaders(),
          });
          localStorage.removeItem("cykruit_applications");
          localStorage.removeItem("cykruit_saved_jobs");
          localStorage.removeItem("cykruit_messages");
          localStorage.removeItem("cykruit_notifications");
          localStorage.removeItem("cykruit_employer_notifications");
          broadcastLogout();
          toast({ type: "success", message: "Logged out successfully" });
          router.push("/login");
        } catch (error: any) {
          toast({ type: "error", message: error.message });
        }
      },
    });
  }

  // Shared nav content — used in both desktop sidebar and mobile overlay
  function NavContent({ forMobile = false }: { forMobile?: boolean }) {
    return (
      <>
        {/* Logo */}
        <div className="flex items-center h-16 border-b border-slate-100 px-4 gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span
            className={`text-base font-bold text-slate-900 tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${
              forMobile
                ? "opacity-100"
                : collapsed
                ? "w-0 opacity-0"
                : "w-auto opacity-100 delay-150"
            }`}
          >
            Cykruit
          </span>
          {/* Close button — mobile only */}
          {forMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            const isCollapsed = !forMobile && collapsed;
            let badge = undefined;
            if (label === "Messages") badge = unreadMsgs > 0 ? unreadMsgs : undefined;
            if (label === "Notifications") badge = unreadNotifs > 0 ? unreadNotifs : undefined;
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                onClick={() => forMobile && setMobileOpen(false)}
                className={`flex items-center py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group overflow-hidden ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                } ${isCollapsed ? "justify-center w-10 mx-auto px-0" : "px-3 gap-3"}`}
              >
                <div className="relative shrink-0">
                  <Icon
                    className={`w-4.5 h-4.5 ${
                      active
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  {badge && !active && isCollapsed && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 border border-white" />
                  )}
                </div>

                <span
                  className={`flex-1 whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isCollapsed ? "w-0 max-w-0 opacity-0" : "opacity-100 delay-150"
                  }`}
                >
                  {label}
                </span>

                {badge && !active && (
                  <span
                    className={`text-[10px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded-full leading-none shrink-0 transition-all duration-300 ${
                      isCollapsed
                        ? "w-0 opacity-0 overflow-hidden px-0"
                        : "opacity-100 delay-150"
                    }`}
                  >
                    {badge}
                  </span>
                )}

                {active && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 transition-all duration-300 ${
                      isCollapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100 delay-150"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 border-t border-slate-100 pt-3">
          <button
            onClick={handleSignOut}
            title={!forMobile && collapsed ? "Sign Out" : undefined}
            className={`flex items-center py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all overflow-hidden ${
              !forMobile && collapsed
                ? "justify-center w-10 mx-auto px-0"
                : "w-full px-3 gap-3"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                !forMobile && collapsed
                  ? "w-0 max-w-0 opacity-0"
                  : "opacity-100 delay-150"
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── DESKTOP sidebar (md and above) ── */}
      <div
        className={`relative shrink-0 transition-all duration-300 hidden md:block ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <aside className="flex flex-col h-screen bg-white border-r border-slate-200 overflow-hidden w-full">
          <NavContent forMobile={false} />
        </aside>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all z-10"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* ── MOBILE: floating hamburger button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── MOBILE: backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE: slide-in sidebar overlay ── */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-slate-200 shadow-xl transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent forMobile={true} />
      </aside>
    </>
  );
}
