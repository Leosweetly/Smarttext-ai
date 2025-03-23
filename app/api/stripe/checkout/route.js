import { NextResponse } from "next/server";
import { withApiAuthRequired } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/payment";

// This endpoint is protected and only accessible to authenticated users
export const POST = withApiAuthRequired(async function handler(req) {
  try {
    const { planId } = await req.json();
    
    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }
    
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
    // For now, we'll use the user's email to create a new customer
    const userEmail = user.email;
    
    // Create a checkout session
    const checkoutSession = await createCheckoutSession({
      userEmail,
      planId,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?canceled=true`
    });
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
});
