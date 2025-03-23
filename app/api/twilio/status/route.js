import { NextResponse } from "next/server";
import { getTwilioNumberStatus } from "@/lib/twilio/phone-manager";

export async function POST(req) {
  try {
    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    const status = await getTwilioNumberStatus(phoneNumber);
    
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error("Error checking Twilio status:", error);
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
