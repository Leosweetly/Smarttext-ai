import { NextResponse } from "next/server";
import { logError, handleApiError } from "@/lib/utils";

/**
 * POST handler for Zapier webhook triggers
 * This endpoint receives webhook requests from Zapier and processes them
 * @param {Request} req - The request object
 * @returns {Promise<NextResponse>} The response object
 */
export async function POST(req) {
  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.ZAPIER_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook secret" },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await req.json();
    
    // Validate request data
    if (!data || !data.event) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Process different event types
    switch (data.event) {
      case 'missed_call':
        return handleMissedCallEvent(data);
      case 'new_message':
        return handleNewMessageEvent(data);
      case 'appointment_booked':
        return handleAppointmentBookedEvent(data);
      case 'lead_created':
        return handleLeadCreatedEvent(data);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown event type: ${data.event}` },
          { status: 400 }
        );
    }
  } catch (error) {
    // Log the error
    logError(error, { path: '/api/webhooks/zapier' }, 'zapier-webhook');
    
    // Return error response
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle missed call event
 * @param {Object} data - The event data
 * @returns {Promise<NextResponse>} The response object
 */
async function handleMissedCallEvent(data) {
  try {
    // Validate required fields
    if (!data.phoneNumber || !data.timestamp) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for missed call event" },
        { status: 400 }
      );
    }

    // Log the missed call event
    console.log(`[Zapier Webhook] Missed call from ${data.phoneNumber} at ${data.timestamp}`);

    // Process the missed call (in a real implementation, this would do something with the data)
    // For example, you might add it to a database, send a notification, etc.

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Missed call event processed successfully",
      data: {
        phoneNumber: data.phoneNumber,
        timestamp: data.timestamp,
        processed: true
      }
    });
  } catch (error) {
    return handleApiError(error, null, 'zapier-missed-call');
  }
}

/**
 * Handle new message event
 * @param {Object} data - The event data
 * @returns {Promise<NextResponse>} The response object
 */
async function handleNewMessageEvent(data) {
  try {
    // Validate required fields
    if (!data.phoneNumber || !data.message || !data.timestamp) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for new message event" },
        { status: 400 }
      );
    }

    // Log the new message event
    console.log(`[Zapier Webhook] New message from ${data.phoneNumber} at ${data.timestamp}: ${data.message}`);

    // Process the new message (in a real implementation, this would do something with the data)
    // For example, you might add it to a database, send a notification, etc.

    // Return success response
    return NextResponse.json({
      success: true,
      message: "New message event processed successfully",
      data: {
        phoneNumber: data.phoneNumber,
        message: data.message,
        timestamp: data.timestamp,
        processed: true
      }
    });
  } catch (error) {
    return handleApiError(error, null, 'zapier-new-message');
  }
}

/**
 * Handle appointment booked event
 * @param {Object} data - The event data
 * @returns {Promise<NextResponse>} The response object
 */
async function handleAppointmentBookedEvent(data) {
  try {
    // Validate required fields
    if (!data.phoneNumber || !data.appointmentTime || !data.timestamp) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for appointment booked event" },
        { status: 400 }
      );
    }

    // Log the appointment booked event
    console.log(`[Zapier Webhook] Appointment booked by ${data.phoneNumber} at ${data.timestamp} for ${data.appointmentTime}`);

    // Process the appointment booked event (in a real implementation, this would do something with the data)
    // For example, you might add it to a database, send a notification, etc.

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Appointment booked event processed successfully",
      data: {
        phoneNumber: data.phoneNumber,
        appointmentTime: data.appointmentTime,
        timestamp: data.timestamp,
        processed: true
      }
    });
  } catch (error) {
    return handleApiError(error, null, 'zapier-appointment-booked');
  }
}

/**
 * Handle lead created event
 * @param {Object} data - The event data
 * @returns {Promise<NextResponse>} The response object
 */
async function handleLeadCreatedEvent(data) {
  try {
    // Validate required fields
    if (!data.phoneNumber || !data.name || !data.timestamp) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for lead created event" },
        { status: 400 }
      );
    }

    // Log the lead created event
    console.log(`[Zapier Webhook] Lead created for ${data.name} (${data.phoneNumber}) at ${data.timestamp}`);

    // Process the lead created event (in a real implementation, this would do something with the data)
    // For example, you might add it to a database, send a notification, etc.

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Lead created event processed successfully",
      data: {
        phoneNumber: data.phoneNumber,
        name: data.name,
        timestamp: data.timestamp,
        processed: true
      }
    });
  } catch (error) {
    return handleApiError(error, null, 'zapier-lead-created');
  }
}

/**
 * GET handler for testing the webhook endpoint
 * @returns {Promise<NextResponse>} The response object
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Zapier webhook endpoint is working",
    documentation: "Send a POST request to this endpoint with the appropriate event data to trigger a webhook action"
  });
}
