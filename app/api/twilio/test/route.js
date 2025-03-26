import { NextResponse } from "next/server";
import { getTwilioNumberStatus } from "../../../../lib/twilio/phone-manager.js";

export async function POST(req) {
  try {
    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Test the configuration by checking the status
    const status = await getTwilioNumberStatus(phoneNumber);
    
    // Determine if the configuration is valid
    const isValid = status.exists && status.isConfigured;
    
    return NextResponse.json({
      success: true,
      isValid,
      status,
      message: isValid 
        ? "Twilio number is properly configured" 
        : "Twilio number is not properly configured"
    });
  } catch (error) {
    console.error("Error testing Twilio configuration:", error);
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
