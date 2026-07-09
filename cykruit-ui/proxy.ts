import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "session_token";
const ROLE_COOKIE    = "user_role";

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

const ADMIN_PREFIXES = ["/admin"];

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
  const isAdminRoute    = matchesAny(pathname, ADMIN_PREFIXES);
  const isGuestOnly     = matchesAny(pathname, GUEST_ONLY);

  // Unauthenticated → login
  if (!isAuthed && (isSeekerRoute || isEmployerRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated on guest page → home
  if (isAuthed && isGuestOnly) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - /api/* (backend proxy rewrites)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)).*)",
  ],
};
