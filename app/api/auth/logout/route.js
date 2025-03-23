import { handleLogout } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Get the URL to redirect to after logout
    const returnTo = req.nextUrl.searchParams.get('returnTo') || '/';
    
    // Handle the logout request
    return await handleLogout(req, new Response(), {
      returnTo,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to log out' },
      { status: 500 }
    );
  }
}
