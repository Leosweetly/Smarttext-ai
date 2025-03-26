import { NextResponse } from "next/server";
import { configureTwilioNumber } from "../../../../lib/twilio/phone-manager.js";

export async function POST(req) {
  try {
    const { phoneNumber, options } = await req.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Configure the Twilio number with optional parameters
    const result = await configureTwilioNumber(phoneNumber, options || {});
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Error configuring Twilio number:", error);
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
