// admin-ui/proxy.ts
// Next.js 16 route guard — replaces middleware.ts.
// If no session_token cookie and path is not public → redirect to /login?redirect=<path>.
// Adapted from cykruit-ui/proxy.ts.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isPublicPath(pathname: string): boolean {
  if (pathname === '/login' || pathname === '/accept-invite') return true;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    /\.(ico|png|jpg|jpeg|gif|svg|css|js|woff2?|ttf|eot)$/.test(pathname)
  ) {
    return true;
  }
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const sessionToken = request.cookies.get('admin_session_token')?.value;
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
