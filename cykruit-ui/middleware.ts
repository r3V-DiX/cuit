import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || "http://127.0.0.1:4001";

const EMPLOYER_ROUTES = /^\/(employer)(\/|$)/;
const SEEKER_ROUTES   = /^\/(dashboard|profile|applications|saved|notifications|messages|settings)(\/|$)/;
const AUTH_ROUTES     = /^\/(login|register|verify-email|forgot-password|reset-password)(\/|$)/;

async function getSession(req: NextRequest): Promise<{ role: string; id: string } | null> {
  const sessionToken = req.cookies.get("session_token")?.value;
  if (!sessionToken) return null;

  try {
    const res = await fetch(`${AUTH_SERVICE}/auth/me`, {
      headers: {
        cookie: `session_token=${sessionToken}`,
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isEmployerRoute = EMPLOYER_ROUTES.test(pathname);
  const isSeekerRoute   = SEEKER_ROUTES.test(pathname);
  const isAuthRoute     = AUTH_ROUTES.test(pathname);

  if (!isEmployerRoute && !isSeekerRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const user = await getSession(req);

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && user) {
    const dest = user.role === "EMPLOYER" ? "/employer/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Require auth for protected routes
  if ((isEmployerRoute || isSeekerRoute) && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role mismatch — employer visiting seeker routes or vice versa
  if (isEmployerRoute && user && user.role !== "EMPLOYER") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (isSeekerRoute && user && user.role === "EMPLOYER") {
    return NextResponse.redirect(new URL("/employer/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/employer/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/applications/:path*",
    "/saved/:path*",
    "/notifications/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/login",
    "/register",
    "/register/:path*",
    "/verify-email/:path*",
    "/forgot-password",
    "/reset-password",
  ],
};
