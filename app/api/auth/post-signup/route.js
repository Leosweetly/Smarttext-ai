import { NextResponse } from "next/server";
import { createBusiness } from "@/lib/data/business";
import { configureTwilioNumber } from "@/lib/twilio/phone-manager";

export async function POST(req) {
  try {
    const { user, phoneNumber, plan } = await req.json();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User data is required" },
        { status: 400 }
      );
    }
    
    // Create the business
    const business = await createBusiness({
      name: user.name || "My Business",
      phoneNumber: phoneNumber || "",
      subscriptionTier: plan || "basic",
      // Add other default fields
      address: "",
      businessType: "other",
      hours: {},
    });
    
    // Configure Twilio if phone number is provided
    let twilioConfig = null;
    if (phoneNumber) {
      try {
        twilioConfig = await configureTwilioNumber(phoneNumber);
      } catch (twilioError) {
        console.error("Error configuring Twilio:", twilioError);
        // Continue even if Twilio configuration fails
      }
    }
    
    return NextResponse.json({
      success: true,
      business,
      twilioConfig
    });
  } catch (error) {
    console.error("Error in post-signup processing:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}
