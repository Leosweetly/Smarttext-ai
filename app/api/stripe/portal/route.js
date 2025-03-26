import { NextResponse } from "next/server";
import { withApiAuthRequired } from "../../../../lib/auth";
import { createPortalSession } from "../../../../lib/payment";

// This endpoint is protected and only accessible to authenticated users
export const POST = withApiAuthRequired(async function handler(req) {
  try {
    // Get the user from the session
    const session = await req.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }
    
    // In a real app, you would get the Stripe customer ID from your database
    // For this example, we'll assume the user has a stripeCustomerId property
    const customerId = user.stripeCustomerId;
    
    if (!customerId) {
      return NextResponse.json(
        { error: "No Stripe customer ID found for this user" },
        { status: 400 }
      );
    }
    
    // Create a portal session
    const portalSession = await createPortalSession(
      customerId,
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription`
    );
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
});
