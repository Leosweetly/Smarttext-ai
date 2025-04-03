import { NextResponse } from "next/server";
// TODO: Re-enable this import when the rate-limit module is implemented
// import { apiRateLimit, authRateLimit, webhookRateLimit } from "@/lib/middleware/rate-limit";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * Next.js middleware function
 * This function is executed for every request to the application
 * @param {Request} request - The request object
 * @returns {Promise<Response>} The response object
 */
export async function middleware(request) {
  // Check if the request is for a dashboard route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      // Get the auth cookie
      const cookieStore = cookies();
      const authCookie = cookieStore.get('appSession');
      
      if (!authCookie || !authCookie.value) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'unauthorized');
        loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // In development mode, allow access without validating the cookie
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
      }
      
      // In production, validate the session cookie
      try {
        // Get the authorization header
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          // Verify and decode the token
          // Note: In production, you would verify this with Auth0 public key
          const decoded = jwt.decode(token);
          if (!decoded) {
            throw new Error('Invalid token');
          }
        } else {
          // If no valid auth header, check if we're in development mode
          if (process.env.NODE_ENV !== 'development') {
            throw new Error('No valid authorization header');
          }
        }
      } catch (error) {
        console.error('Auth middleware error:', error);
        // In case of error, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'auth_error');
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      // In case of error, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'auth_error');
      return NextResponse.redirect(loginUrl);
    }
  }

  // TODO: Re-enable rate limiting when the rate-limit module is implemented
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // // Apply rate limiting to API routes
    // const apiResponse = await apiRateLimit()(request);
    // if (apiResponse.status === 429) {
    //   return apiResponse;
    // }

    // // Apply stricter rate limiting to auth routes
    // const authResponse = await authRateLimit()(request);
    // if (authResponse.status === 429) {
    //   return authResponse;
    // }

    // // Apply rate limiting to webhook routes
    // const webhookResponse = await webhookRateLimit()(request);
    // if (webhookResponse.status === 429) {
    //   return webhookResponse;
    // }
  }

  // Continue with the request
  return NextResponse.next();
}

/**
 * Configure which paths this middleware is applied to
 * @see https://nextjs.org/docs/advanced-features/middleware#matcher
 */
export const config = {
  // Apply middleware to API routes and dashboard routes
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
