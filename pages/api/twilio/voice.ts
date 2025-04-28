// Next.js API route: /pages/api/voice.ts
// Smarttext AI voice webhook handler
// ------------------------------------------------------------
// Features:
// • Validates Twilio signature to reject spoofed requests
// • Greets every caller and optionally forwards to the business's
//   chosen number (or a global fallback)
// • Sends an automatic SMS ("Smarttext") to the caller so the
//   conversation continues over text
// • Logs richly for easy forensics but keeps HTTP 200 semantics so
//   Twilio won't retry on internal errors
// ------------------------------------------------------------

import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'querystring';
import twilio, { validateRequest } from 'twilio';
// Import the functions we need directly
import { sendSms } from '../../../lib/twilio';

// Import from compatibility layer that handles both development and production environments
import { 
  getBusinessByPhoneNumberSupabase,
  trackSmsEvent 
} from '../../../lib/api-compat.js';

export const config = {
  api: { bodyParser: false } // we need the raw stream for signature validation
};

interface TwilioVoiceWebhookParams {
  To: string;
  From: string;
  CallSid: string;
  [key: string]: any;
}

const twilioClient = twilio(
  process.env.TWILIO_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('📞 Voice handler hit');

  try {
    // -----------------------------------------------------------------
    // 1. Read the raw request body (needed for signature validation)
    // -----------------------------------------------------------------
    let rawBody = '';
    for await (const chunk of req) rawBody += chunk.toString();

    // Log raw body for forensic analysis
    console.log('🔍 [FORENSIC] Raw request body:', rawBody);

    // -----------------------------------------------------------------
    // 2. Validate Twilio signature (protect against forged requests)
    // -----------------------------------------------------------------
    const signature = req.headers['x-twilio-signature'] as string | undefined;
    const fullUrl = process.env.PUBLIC_BASE_URL 
      ? `${process.env.PUBLIC_BASE_URL}${req.url}` 
      : `https://${req.headers.host}${req.url}`;

    // Parse the body for validation
    const parsedBody = parse(rawBody) as Record<string, any>;

    // Only validate in production (unless explicitly skipped)
    const isTestEnv = process.env.NODE_ENV !== 'production' || process.env.SKIP_TWILIO_SIGNATURE === 'true';
    
    if (!isTestEnv) {
      // More robust URL construction with consistent format
      const webhookUrl = process.env.PUBLIC_BASE_URL 
        ? `${process.env.PUBLIC_BASE_URL.replace(/\/+$/, '')}/api/twilio/voice` 
        : `https://${req.headers.host}/api/twilio/voice`;
      
      // Enhanced logging for debugging
      console.log("🔍 Validation attempt with:", {
        authToken: process.env.TWILIO_AUTH_TOKEN ? "present (redacted)" : "missing",
        signature: signature ? signature : "missing",
        webhookUrl,
        paramCount: Object.keys(parsedBody).length
      });
      
      if (
        !signature ||
        !validateRequest(
          process.env.TWILIO_AUTH_TOKEN!,
          signature,
          webhookUrl,
          parsedBody
        )
      ) {
        console.warn('🚫 Invalid Twilio signature – request rejected');
        
        // Create an error TwiML response instead of plain text
        const errorTwiml = new twilio.twiml.VoiceResponse();
        errorTwiml.say(
          { voice: 'alice' },
          "Invalid request signature. This request could not be verified as coming from Twilio."
        );
        
        // Force-set header after TwiML is built and before any body is written
        res.writeHead(403, { 'Content-Type': 'text/xml' });
        return res.end(errorTwiml.toString());
      }
      console.log('✅ Twilio signature validated successfully');
    } else {
      console.log('⚠️ Skipping Twilio signature validation in test environment');
    }

    // -----------------------------------------------------------------
    // 3. Parse URL‑encoded form body
    // -----------------------------------------------------------------
    const body = parse(rawBody) as unknown as TwilioVoiceWebhookParams;
    console.log(
      '📨 Parsed Twilio webhook parameters:',
      JSON.stringify(body, null, 2)
    );

    const { To, From, CallSid } = body;
    if (!To || !From) {
      console.error('❌ Missing To or From in Twilio webhook');
      
      // Create an error TwiML response instead of JSON
      const errorTwiml = new twilio.twiml.VoiceResponse();
      errorTwiml.say(
        { voice: 'alice' },
        "Missing required parameters. The webhook must include To and From fields."
      );
      
      // Force-set header after TwiML is built and before any body is written
      res.writeHead(400, { 'Content-Type': 'text/xml' });
      return res.end(errorTwiml.toString());
    }

    // Normalise numbers to E.164 (assume US if country code absent)
    const toNumber = normalizePhoneE164(To);
    const fromNumber = normalizePhoneE164(From);

    console.log(
      `📞 Incoming call from ${fromNumber} to ${toNumber} (CallSid: ${CallSid})`
    );

    // -----------------------------------------------------------------
    // 4. Business lookup & forwarding target
    // -----------------------------------------------------------------
    console.log(`🔍 Looking up business for phone number: ${toNumber}`);
    const business = await getBusinessByPhoneNumberSupabase(toNumber);
    
    if (business) {
      console.log(`✅ Business found: ${business.name} (${business.id})`);
    } else {
      console.log(`❌ No business found for phone number: ${toNumber}`);
    }
    
    const businessName = business?.name || 'our business';
    console.log(`🏢 Using business name: ${businessName}`);

    // Check for test override forwarding number
    let testOverrides: { forwardingNumber?: string; testMode?: boolean } = {};
    if (body._testOverrides) {
      try {
        testOverrides = JSON.parse(body._testOverrides as string);
        console.log('📋 Test overrides:', testOverrides);
      } catch (error) {
        console.error('❌ Error parsing test overrides:', error);
      }
    }
    
    let forwardingNumber = 
      testOverrides.forwardingNumber ??
      business?.customSettings?.forwardingNumber ??
      process.env.FALLBACK_FORWARDING ??
      '';
    if (forwardingNumber) forwardingNumber = normalizePhoneE164(forwardingNumber);

    console.log(
      `📱 Chosen forwarding number: ${forwardingNumber || 'None available'}`
    );

    // -----------------------------------------------------------------
    // 5. Build TwiML response
    // -----------------------------------------------------------------
    const twiml = new twilio.twiml.VoiceResponse();

    // Always greet the caller first
    twiml.say(
      { voice: 'alice' },
      `Hey, thanks for calling ${businessName}, we're currently unavailable but we will text you shortly.`
    );
    
    // Add a pause to ensure the greeting is heard
    twiml.pause({ length: 1 });
    
    // Hang up the call
    twiml.hangup();
    
    // -----------------------------------------------------------------
    // 6. Return TwiML (HTTP 200 so Twilio won't retry)
    // -----------------------------------------------------------------
    const twimlString = twiml.toString();
    console.log(`📄 Final TwiML response:`, twimlString);
    
    // Force-set header after TwiML is built and before any body is written
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twimlString);
  } catch (error: any) {
    // -----------------------------------------------------------------
    // 7. Fallback error TwiML (still HTTP 200 per your preference)
    // -----------------------------------------------------------------
    console.error('❌ Voice handler error:', error.message);
    console.error('Stack trace:', error.stack);

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      { voice: 'alice' },
      "We're sorry, but we encountered an error processing your call. Please try again later."
    );

    const errorTwimlString = twiml.toString();
    console.log(`� Error TwiML response:`, errorTwimlString);

    // Force-set header after TwiML is built and before any body is written
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(errorTwimlString);
  }
}

// ------------------------------------------------------------
// Helper – naive E.164 coercion (assumes US if no +country code)
// In production, consider libphonenumber-js for full validation.
// ------------------------------------------------------------
function normalizePhoneE164(num: string): string {
  const digits = num.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  // Assume US default
  return `+1${digits}`;
}
