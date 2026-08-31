import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "session_token";
const ROLE_COOKIE    = "user_role";

// Razorpay's checkout.js injects <style> tags and inline style="..." attributes
// directly into the page DOM (not loaded from checkout.razorpay.com), so domain
// whitelisting in style-src does not cover them. Once a nonce-source is present
// in style-src, browsers ignore 'unsafe-inline' as a fallback — so there is no
// way to keep a nonce-based style-src AND let Razorpay's injected styles apply.
// We relax style-src (drop the nonce, allow 'unsafe-inline') ONLY on the
// checkout route where Razorpay's widget actually runs. Every other route keeps
// the strict nonce-based CSP.
const RAZORPAY_CHECKOUT_PATH = "/employer/subscription/checkout";

function buildCsp(nonce: string, relaxedStyles: boolean): string {
  const isDev = process.env.NODE_ENV === "development";
  const styleSrc = relaxedStyles
    ? `style-src 'self' 'unsafe-inline' https://checkout.razorpay.com`
    : `style-src 'self' 'nonce-${nonce}' https://checkout.razorpay.com`;

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://checkout.razorpay.com https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`,
    styleSrc,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // 'self' covers wss://<same-host> for WebSocket — no explicit WS origin needed
    `connect-src 'self' http://127.0.0.1:* http://localhost:* https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com`,
    "frame-src https://api.razorpay.com https://checkout.razorpay.com",
    "frame-ancestors 'none'",
  ].join("; ");
}

const SEEKER_PREFIXES = [
  "/dashboard",
  "/applications",
  "/saved",
  "/messages",
  "/notifications",
  "/profile",
  "/settings",
];

const EMPLOYER_PREFIXES = [
  "/employer/dashboard",
  "/employer/jobs",
  "/employer/applicants",
  "/employer/company",
  "/employer/messages",
  "/employer/notifications",
  "/employer/settings",
  "/employer/subscription",
  "/employer/team",
  "/employer/activity",
  "/kyc",
];

// NOTE: /employer/accept-invite is intentionally NOT in EMPLOYER_PREFIXES.
// It must be accessible to authenticated users of any role (including SEEKER)
// so that invitees can accept an employer team invitation regardless of their
// current account role.

const GUEST_ONLY = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

function matchesAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = !!request.cookies.get(SESSION_COOKIE)?.value;
  const role     = request.cookies.get(ROLE_COOKIE)?.value ?? "";

  const isSeekerRoute   = matchesAny(pathname, SEEKER_PREFIXES);
  const isEmployerRoute = matchesAny(pathname, EMPLOYER_PREFIXES);
  const isGuestOnly     = matchesAny(pathname, GUEST_ONLY);

  // Unauthenticated → login (preserve full path + query so invite tokens survive redirect)
  if (!isAuthed && (isSeekerRoute || isEmployerRoute)) {
    const loginUrl = new URL("/login", request.url);
    const fullPath = request.nextUrl.search
      ? `${pathname}${request.nextUrl.search}`
      : pathname;
    loginUrl.searchParams.set("next", fullPath);
    return NextResponse.redirect(loginUrl);
  }

  // NOTE: We intentionally do NOT redirect authenticated users away from guest-only
  // pages. The proxy reads cookies but cannot verify whether the session is actually
  // valid — a stale/expired session_token cookie would cause an infinite redirect loop
  // (proxy bounces to dashboard → layout 401 → back to /login → proxy bounces again).
  // Post-login redirect is handled by the login/register pages themselves after
  // the backend confirms the session is valid.

  // Role mismatch: employer on seeker routes → employer dashboard
  if (isAuthed && role === "EMPLOYER" && isSeekerRoute) {
    return NextResponse.redirect(new URL("/employer/dashboard", request.url));
  }

  // Role mismatch: seeker on employer routes → seeker dashboard
  if (isAuthed && role === "SEEKER" && isEmployerRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  });

  const relaxedStyles = pathname === RAZORPAY_CHECKOUT_PATH || pathname.startsWith(RAZORPAY_CHECKOUT_PATH + "/");

  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", buildCsp(nonce, relaxedStyles));
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - /api/* (backend proxy rewrites — auth enforced by NestJS guards, NOT this middleware)
     * - public files with extensions
     *
     * NOTE: /api/* is intentionally excluded. All /api/* routes are proxy rewrites
     * to the NestJS backend, which enforces auth via its own guards (JwtAuthGuard,
     * RolesGuard, etc.). Do NOT add any /api/* route that relies solely on this
     * middleware for access control.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)).*)",
  ],
};