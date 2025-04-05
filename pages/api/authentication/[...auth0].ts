import { NextRequest, NextResponse } from 'next/server';
import { auth0Config } from '../../../auth0.config';

/**
 * Auth0 catch-all API route handler for Pages Router
 * This file handles all Auth0-related routes, including:
 * - /api/authentication/login
 * - /api/authentication/callback
 * - /api/authentication/logout
 * - /api/authentication/me
 * 
 * Note: This is a fallback for the App Router implementation.
 * The App Router routes in /app/api/auth/ should be used primarily.
 */
export default async function handler(req: NextRequest, res: any) {
  const { pathname } = new URL(req.url);
  
  // Extract the route from the pathname
  const route = pathname.replace('/api/authentication/', '');
  
  try {
    // Redirect to the corresponding App Router route
    const redirectUrl = `/api/authentication/${route}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    return NextResponse.redirect(new URL(redirectUrl, 'https://getsmarttext.com'));
  } catch (error) {
    console.error(`Auth0 route error (${route}):`, error);
    return NextResponse.json(
      { error: `Failed to process Auth0 request: ${route}` },
      { status: 500 }
    );
  }
}
