import { handleCallback } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Handle the callback from Auth0
    const res = await handleCallback(req, new Response());
    
    // Return the response
    return res;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect('/login?error=callback_error');
  }
}
