"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Shield, User } from "lucide-react";
import Button from "@/components/ui/Button";

const navLinks = [
  { label: "Browse Jobs", href: "/jobs" },
  { label: "For Employers", href: "/employers" },
  { label: "About", href: "/about" },
];

function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("csrf_token="));
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  // Always starts true on both server and client — hasSessionCookie() reads
  // document.cookie, which only exists client-side. Deciding the initial
  // value from it here (even guarded) makes the client's pre-hydration
  // render differ from the server's, which is a real hydration mismatch,
  // not just a cosmetic flash. Resolved for real in the effect below,
  // which only ever runs client-side after hydration completes.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSessionCookie()) { setLoading(false); return; }
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((result) => {
        if (result?.success && result?.data) setUser(result.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dashboardHref = user?.userType === "EMPLOYER" ? "/employer/dashboard" : "/dashboard";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-darkest border-b border-white/8 shadow-sm shadow-black/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Cykruit</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/8 transition-all duration-150 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA — fixed min-width so layout never shifts */}
        <div className="hidden md:flex items-center gap-3 min-w-52 justify-end">
          {loading ? (
            // Same dimensions as the buttons so layout is stable
            <div className="flex items-center gap-3">
              <div className="w-18 h-8 rounded-lg bg-white/10" />
              <div className="w-26 h-8 rounded-lg bg-white/10" />
            </div>
          ) : user ? (
            <Link
              href={dashboardHref}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10 group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white group-hover:text-blue-200 transition-colors">Dashboard</span>
            </Link>
          ) : (
            <>
              <Button href="/login" variant="outline-light" size="sm">Sign In</Button>
              <Button href="/register" variant="primary" size="sm">Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-white/8 rounded-lg transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-bg-dark border-b border-white/8">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/8 rounded-lg transition-all font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/8">
              {loading ? (
                <div className="w-full h-10 rounded-xl bg-white/10" />
              ) : user ? (
                <Button href={dashboardHref} variant="primary" size="md" fullWidth>Dashboard</Button>
              ) : (
                <>
                  <Button href="/login" variant="secondary" size="md" fullWidth>Sign In</Button>
                  <Button href="/register" variant="primary" size="md" fullWidth>Get Started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
