import { NextResponse } from "next/server";
import twilio from "twilio";
import { getBusinessByPhoneNumber, getLocationByPhoneNumber, getBusinessWithLocations } from "../../../lib/data";
import { generateMissedCallResponse, generateLocationMissedCallResponse } from "../../../lib/ai";
import { trackLeadSource } from "../../../lib/marketing";

export async function POST(req) {
    try {
        // Check if Twilio credentials are set
        const TWILIO_SID = process.env.TWILIO_SID;
        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
        
        if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
            console.error("Twilio credentials not found in environment variables");
            return NextResponse.json(
                { success: false, error: "Twilio credentials not configured" },
                { status: 500 }
            );
        }

        // Twilio sends data as form-encoded
        const formData = await req.formData();
        const From = formData.get("From");
        const To = formData.get("To");
        const CallStatus = formData.get("CallStatus");

        if (!From || !To) {
            return NextResponse.json(
                { success: false, error: "Missing required parameters: From and To" },
                { status: 400 }
            );
        }

        // Check if this is a status callback for a completed call
        // Only process missed calls (no-answer, busy, failed, or completed with short duration)
        const relevantStatuses = ['no-answer', 'busy', 'failed'];
        const isRelevantStatus = CallStatus && relevantStatuses.includes(CallStatus);
        
        // If CallStatus is provided but not a relevant status, don't send an auto-text
        if (CallStatus && !isRelevantStatus) {
            console.log(`Call from ${From} to ${To} with status ${CallStatus} - not sending auto-text`);
            return NextResponse.json({ 
                success: true,
                message: "Call status not requiring auto-text"
            });
        }

        console.log(`Missed call from ${From} to ${To}${CallStatus ? ` (Status: ${CallStatus})` : ''}`);

        const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

        // First check if this is a location-specific phone number
        let location;
        let business;
        let messageBody;

        try {
            location = await getLocationByPhoneNumber(To);
            
            if (location) {
                // If it's a location, get the parent business
                business = await getBusinessByPhoneNumber(location.businessId);
                
                try {
                    // Generate a location-specific response
                    messageBody = await generateLocationMissedCallResponse(location, business, business?.subscriptionTier || 'basic');
                } catch (aiError) {
                    console.error("Error generating location-specific AI response:", aiError);
                    
                    // Fallback to basic template if AI generation fails
                    messageBody = `Thanks for calling ${location.name}${business ? ` at ${business.name}` : ''}. We'll get back to you as soon as possible.`;
                }
            } else {
                // If not a location, try to find the business directly
                business = await getBusinessByPhoneNumber(To);
                
                if (business) {
                    try {
                        // Check if this is a multi-location business
                        if (business.hasMultipleLocations) {
                            // Get the business with all its locations
                            const businessWithLocations = await getBusinessWithLocations(business.id);
                            
                            // Generate a response that mentions multiple locations
                            messageBody = await generateMissedCallResponse(businessWithLocations, business.subscriptionTier, true);
                        } else {
                            // Generate a standard response
                            messageBody = await generateMissedCallResponse(business, business.subscriptionTier);
                        }
                    } catch (aiError) {
                        console.error("Error generating AI response:", aiError);
                        
                        // Fallback to basic template if AI generation fails
                        if (business.businessType === 'restaurant' && business.orderingLink) {
                            messageBody = `Thanks for calling ${business.name}. Would you like to place an online order? Visit: ${business.orderingLink}`;
                        } else if (business.businessType === 'auto shop' && business.quoteLink) {
                            messageBody = `Thanks for calling ${business.name}. Need a quote? Visit: ${business.quoteLink}`;
                        } else {
                            messageBody = `Thanks for calling ${business.name}. We'll get back to you as soon as possible.`;
                        }
                    }
                } else {
                    // Generic message if neither location nor business found
                    messageBody = `Thanks for calling. We'll get back to you as soon as possible.`;
                }
            }
        } catch (error) {
            console.error("Error fetching location/business data:", error);
            // Continue with a generic message if Airtable fails
            messageBody = `Thanks for calling. We'll get back to you as soon as possible.`;
        }

        // Send the message via Twilio
        try {
            // Use the SmartText AI number if available, otherwise use the business number
            const fromNumber = process.env.TWILIO_SMARTTEXT_NUMBER || To;
            
            await client.messages.create({
                body: messageBody,
                from: fromNumber,
                to: From
            });
            
            // Log the successful message for analytics
            console.log(`Sent message to ${From}: "${messageBody.substring(0, 50)}..."`);
            
            // Track the lead source if business is found
            if (business) {
                // Get source from query parameters or default to 'direct'
                const url = new URL(req.url);
                const source = url.searchParams.get('source') || 'direct';
                const campaign = url.searchParams.get('campaign') || null;
                
                // Additional metadata that might be useful
                const metadata = {
                    timestamp: new Date().toISOString(),
                    businessType: business.businessType,
                    messageType: 'missed_call_response'
                };
                
                // Track the lead source asynchronously (don't await)
                trackLeadSource(From, source, campaign, metadata)
                    .then(result => {
                        console.log(`Lead source tracked: ${source}, new lead: ${result.isNewLead}`);
                    })
                    .catch(err => {
                        console.error("Error tracking lead source:", err);
                    });
            }
            
        } catch (twilioError) {
            console.error("Error sending Twilio message:", twilioError);
            return NextResponse.json(
                { success: false, error: "Failed to send text message" },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true,
            message: messageBody
        });

    } catch (error) {
        console.error("Error handling missed call:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// Handle GET requests with a 405 Method Not Allowed response
export async function GET() {
    console.log("GET request received to /api/missed-call - returning 405");
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

// Handle all HTTP methods to ensure we don't return 405 for Twilio's requests
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This is a workaround for Next.js API routes to handle all HTTP methods
export async function PUT(req) {
    console.log("PUT request received to /api/missed-call - forwarding to POST handler");
    return POST(req);
}

export async function DELETE(req) {
    console.log("DELETE request received to /api/missed-call - forwarding to POST handler");
    return POST(req);
}

export async function PATCH(req) {
    console.log("PATCH request received to /api/missed-call - forwarding to POST handler");
    return POST(req);
}

export async function HEAD(req) {
    console.log("HEAD request received to /api/missed-call - forwarding to POST handler");
    return POST(req);
}

export async function OPTIONS(req) {
    console.log("OPTIONS request received to /api/missed-call - forwarding to POST handler");
    return POST(req);
}
