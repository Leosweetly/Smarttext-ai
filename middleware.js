import { NextResponse } from 'next/server';

export function middleware(request) {
  // Allow API routes to pass through
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For all other routes, do nothing
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
