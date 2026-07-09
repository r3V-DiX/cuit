import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "session_token";

const AUTHED_PREFIXES = [
  "/dashboard",
  "/applications",
  "/saved",
  "/messages",
  "/notifications",
  "/profile",
  "/settings",
  "/employer/dashboard",
  "/employer/jobs",
  "/employer/applicants",
  "/employer/company",
  "/employer/messages",
  "/employer/notifications",
  "/employer/settings",
  "/employer/subscription",
  "/kyc",
];

const GUEST_ONLY = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

function isAuthedRoute(pathname: string): boolean {
  return AUTHED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function isGuestOnly(pathname: string): boolean {
  return GUEST_ONLY.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = !!request.cookies.get(SESSION_COOKIE)?.value;

  if (!isAuthed && isAuthedRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && isGuestOnly(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)).*)",
  ],
};
