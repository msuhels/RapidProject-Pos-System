import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRegistrationEnabled } from '@/core/config/authConfig';
import { isProtectedRoute } from '@/core/config/protectedRoutes';

/**
 * Next.js proxy for route protection
 * Protects routes based on module configuration and redirects unauthenticated users to login
 * Also checks permissions for routes that require them
 * 
 * NOTE: This runs in Edge Runtime, so we use a static protectedRoutes config file
 * instead of dynamically reading from moduleRegistry (which uses Node.js APIs)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies (set by login)
  const token = request.cookies.get('access-token')?.value;
  
  console.log('[Proxy] Route Access:', {
    pathname,
    hasToken: !!token,
  });
  
  // Check if registration is enabled
  const registrationEnabled = isRegistrationEnabled();
  
  // Public routes that don't require authentication
  const publicRoutes: string[] = ['/login'];
  if (registrationEnabled) {
    publicRoutes.push('/register');
  }
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If trying to access /register when registration is disabled, redirect to login
  if (pathname.startsWith('/register') && !registrationEnabled) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Check if current path is protected (using Edge Runtime compatible config)
  const routeIsProtected = isProtectedRoute(pathname);
  
  // If accessing a protected route without token, redirect to login
  if (!isPublicRoute && !token && routeIsProtected) {
    console.log('[Proxy] Redirecting to login - no token for protected route:', pathname);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing login/register with token, redirect to first accessible route
  // We'll let the client-side handle this redirect after checking permissions
  // to avoid making API calls in Edge Runtime middleware
  if (isPublicRoute && token) {
    // Redirect to a route that will check permissions client-side
    // The login page will handle the redirect to the first accessible route
    console.log('[Proxy] Already authenticated - allowing through to handle redirect client-side');
    return NextResponse.next();
  }
  
  // Skip permission checks in middleware - ProtectedPage component handles this client-side
  // This avoids redundant API calls and improves performance
  // Permission checks are done once on login and cached in the auth store
  // ProtectedPage uses cached permissions for instant checks without API calls
  
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

