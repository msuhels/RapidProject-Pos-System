import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { proxy } from './src/proxy';

/**
 * Next.js middleware
 * Uses the proxy function to protect routes
 */
export async function middleware(request: NextRequest) {
  return await proxy(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - but we need to exclude the permission check endpoint to avoid loops)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth/check-route-permission|api|_next/static|_next/image|favicon.ico).*)',
  ],
};

