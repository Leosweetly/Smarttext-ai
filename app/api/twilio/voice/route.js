import { NextResponse } from "next/server";
import twilio from "twilio";
import { getBusinessByPhoneNumber, getLocationByPhoneNumber } from "../../../../lib/data/index.js";

/**
 * Twilio Voice Webhook Handler
 * 
 * This endpoint generates TwiML to forward incoming calls to the business's actual phone number.
 * It looks up the business or location associated with the Twilio number that was called,
 * retrieves the forwarding phone number, and returns TwiML with a <Dial> verb.
 */
export async function POST(req) {
  try {
    // Parse the Twilio request (form-encoded)
    const formData = await req.formData();
    const to = formData.get("To"); // The Twilio number that was called
    const from = formData.get("From"); // The caller's phone number
    const callSid = formData.get("CallSid"); // Unique identifier for this call

    console.log(`Incoming call from ${from} to ${to} (CallSid: ${callSid})`);

    if (!to || !from) {
      console.error("Missing required parameters: To and From");
      return new NextResponse(generateErrorTwiML("Invalid request parameters"), {
        status: 400,
        headers: {
          "Content-Type": "text/xml",
        },
      });
    }

    // Look up the business or location associated with this Twilio number
    let forwardingNumber = null;
    let businessName = "our business";

    // First check if this is a location-specific phone number
    const location = await getLocationByPhoneNumber(to);
    if (location) {
      // If it's a location, use the manager's phone or look up the parent business
      forwardingNumber = location.managerPhone;
      businessName = location.name;

      // If no manager phone, get the parent business
      if (!forwardingNumber) {
        const business = await getBusinessByPhoneNumber(location.businessId);
        if (business) {
          // Use the business's forwarding number or main phone number
          forwardingNumber = business.forwardingNumber || business.phoneNumber;
          businessName = `${location.name} at ${business.name}`;
        }
      }
    } else {
      // If not a location, try to find the business directly
      const business = await getBusinessByPhoneNumber(to);
      if (business) {
        // Use the business's forwarding number or main phone number
        forwardingNumber = business.forwardingNumber || business.phoneNumber;
        businessName = business.name;
      }
    }

    // If we couldn't find a forwarding number, return an error message
    if (!forwardingNumber) {
      console.error(`No forwarding number found for Twilio number ${to}`);
      return new NextResponse(
        generateErrorTwiML(
          "We're sorry, but we couldn't connect your call at this time. Please try again later."
        ),
        {
          status: 200, // Still return 200 to Twilio
          headers: {
            "Content-Type": "text/xml",
          },
        }
      );
    }

    // Generate TwiML to forward the call
    const twiml = generateForwardingTwiML(forwardingNumber, businessName);

    // Return the TwiML response
    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Error handling voice webhook:", error);
    return new NextResponse(
      generateErrorTwiML(
        "We're sorry, but an error occurred while processing your call. Please try again later."
      ),
      {
        status: 200, // Still return 200 to Twilio
        headers: {
          "Content-Type": "text/xml",
        },
      }
    );
  }
}

/**
 * Generate TwiML to forward a call to the specified phone number
 * @param {string} forwardingNumber - The phone number to forward the call to
 * @param {string} businessName - The name of the business
 * @returns {string} TwiML XML string
 */
function generateForwardingTwiML(forwardingNumber, businessName) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  // Add a brief message before forwarding
  response.say(
    { voice: "alice" },
    `Thank you for calling ${businessName}. Please hold while we connect your call.`
  );

  // Dial the forwarding number with a timeout
  const dial = response.dial({
    timeout: 20, // Seconds to wait for an answer
    callerId: process.env.TWILIO_SMARTTEXT_NUMBER || null, // Use SmartText number as caller ID if available
    action: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/missed-call`,
    method: "POST",
  });
  dial.number(forwardingNumber);

  return response.toString();
}

/**
 * Generate TwiML for error scenarios
 * @param {string} message - The error message to play
 * @returns {string} TwiML XML string
 */
function generateErrorTwiML(message) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  response.say({ voice: "alice" }, message);
  response.hangup();

  return response.toString();
}

// Handle GET requests with a 405 Method Not Allowed response
export async function GET() {
  console.log("GET request received to /api/twilio/voice - returning 405");
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

// Handle all HTTP methods to ensure we don't return 405 for Twilio's requests
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This is a workaround for Next.js API routes to handle all HTTP methods
export async function PUT(req) {
  console.log("PUT request received to /api/twilio/voice - forwarding to POST handler");
  return POST(req);
}

export async function DELETE(req) {
  console.log("DELETE request received to /api/twilio/voice - forwarding to POST handler");
  return POST(req);
}

export async function PATCH(req) {
  console.log("PATCH request received to /api/twilio/voice - forwarding to POST handler");
  return POST(req);
}

export async function HEAD(req) {
  console.log("HEAD request received to /api/twilio/voice - forwarding to POST handler");
  return POST(req);
}

export async function OPTIONS(req) {
  console.log("OPTIONS request received to /api/twilio/voice - forwarding to POST handler");
  return POST(req);
}
