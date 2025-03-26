import { handleLogin } from '../auth-utils';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Get the URL to redirect to after login
    const returnTo = req.nextUrl.searchParams.get('returnTo') || '/dashboard';
    
    // Handle the login request
    return await handleLogin(req, new Response(), {
      returnTo,
      authorizationParams: {
        scope: 'openid profile email',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
}
