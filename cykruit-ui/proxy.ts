import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "session_token";
const ROLE_COOKIE    = "user_role";

const WS_ORIGIN = process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:4007 wss://127.0.0.1:4007";

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}' https://checkout.razorpay.com`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${WS_ORIGIN} http://127.0.0.1:* http://localhost:* https://api.razorpay.com https://checkout.razorpay.com`,
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

  // Authenticated on guest page → home.
  // Skip redirect if a `?next=` param is present — that means the user was
  // explicitly sent to /login (e.g. session expired, layout 401) and we must
  // not bounce them back to the protected route with a stale cookie.
  if (isAuthed && isGuestOnly && !request.nextUrl.searchParams.has("next")) {
    const dest = role === "EMPLOYER" ? "/employer/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

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

  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
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
