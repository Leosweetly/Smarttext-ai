import { handleCallback } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Handle the callback from Auth0
    const res = await handleCallback(req, new Response());
    
    // Check if this is a new user signup by looking for the selectedPlan in localStorage
    // We need to handle this on the client side since we can't access localStorage here
    // Add a query parameter to indicate we should check for post-signup processing
    const url = new URL(res.headers.get('Location'));
    url.searchParams.set('checkPostSignup', 'true');
    
    // Update the redirect URL
    const updatedRes = new Response(null, {
      status: 302,
      headers: new Headers({
        Location: url.toString(),
        'Set-Cookie': res.headers.get('Set-Cookie')
      })
    });
    
    return updatedRes;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect('/login?error=callback_error');
  }
}
