import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  // API routes returning 401 — pass through, let client handle redirect
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const protectedPrefixes = [
    "/dashboard",
    "/profile",
    "/settings",
    "/applications",
    "/employer",
    "/kyc"
  ];

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/applications/:path*",
    "/employer/:path*",
    "/kyc/:path*",
  ],
};
