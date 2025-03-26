import { NextResponse } from "next/server";
import twilio from "twilio";
import { getSession } from "../auth-utils";

/**
 * GET handler for listing all Twilio phone numbers
 * @param {Request} req - The request object
 * @returns {Promise<NextResponse>} The response object
 */
export async function GET(req) {
  try {
    // Check authentication
    const session = await getSession(req, new Response());
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Get all incoming phone numbers
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list();

    // Format the response
    const phoneNumbers = incomingPhoneNumbers.map(number => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      sid: number.sid,
      isConfigured: isNumberConfigured(number),
      capabilities: number.capabilities
    }));

    return NextResponse.json({
      success: true,
      phoneNumbers
    });
  } catch (error) {
    console.error("Error listing Twilio phone numbers:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Check if a phone number is properly configured for SmartText
 * @param {Object} number - The Twilio phone number object
 * @returns {boolean} Whether the number is properly configured
 */
function isNumberConfigured(number) {
  const expectedVoiceUrl = `${process.env.API_BASE_URL || 'https://smarttext-webhook-kyle-davis-projects-30fc1531.vercel.app'}/api/twilio/voice`;
  const expectedStatusCallback = `${process.env.API_BASE_URL || 'https://smarttext-webhook-kyle-davis-projects-30fc1531.vercel.app'}/api/missed-call`;
  
  return (
    number.voiceUrl === expectedVoiceUrl &&
    number.statusCallback === expectedStatusCallback &&
    number.statusCallbackMethod === 'POST' &&
    Array.isArray(number.statusCallbackEvent) &&
    number.statusCallbackEvent.includes('no-answer')
  );
}

/**
 * POST handler for listing Twilio phone numbers (not allowed)
 * @returns {Promise<NextResponse>} The response object
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}
