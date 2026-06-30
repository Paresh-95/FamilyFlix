import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS  = ['/login', '/api/auth', '/api/stream', '/api/drive-url'];
const ADMIN_PUBLIC  = ['/api/admin-auth'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (ADMIN_PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Main session guard
  const session = req.cookies.get('familyflix_session');
  if (session?.value !== 'authenticated') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Admin session guard
  if (pathname.startsWith('/admin')) {
    const adminSession = req.cookies.get('familyflix_admin');
    if (adminSession?.value !== 'authenticated') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('adminAuth', '1');
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
