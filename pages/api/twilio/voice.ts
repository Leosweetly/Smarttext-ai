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
import { sendSms } from '../../../lib/twilio';
import { getBusinessByPhoneNumberSupabase } from '../../../lib/supabase';

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

  console.log('✅ Twilio voice webhook hit!', {
    timestamp: new Date().toISOString()
  });

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

    // Only validate in production to make local testing easier
    if (process.env.NODE_ENV === 'production') {
      if (
        !signature ||
        !validateRequest(
          process.env.TWILIO_AUTH_TOKEN!,
          signature,
          fullUrl,
          parsedBody
        )
      ) {
        console.warn('🚫 Invalid Twilio signature – request rejected');
        return res.status(403).end('Invalid Twilio signature');
      }
      console.log('✅ Twilio signature validated successfully');
    } else {
      console.log('⚠️ Skipping Twilio signature validation in development');
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
      return res
        .status(400)
        .json({ error: 'Missing To or From in Twilio webhook' });
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
    const business = await getBusinessByPhoneNumberSupabase(toNumber);
    const businessName = business?.name || 'our business';

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

    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://api.getsmarttext.com';
    const missedCallUrl = `${baseUrl}/api/missed-call`;
    console.log(`🔗 Using missed-call URL: ${missedCallUrl}`);

    // -----------------------------------------------------------------
    // 5. Build TwiML response
    // -----------------------------------------------------------------
    const twiml = new twilio.twiml.VoiceResponse();

    // Always greet the caller first
    twiml.say(
      { voice: 'alice' },
      `Hey, thanks for calling ${businessName}, we're currently unavailable but we will text you shortly.`
    );
    
    if (forwardingNumber) {
      // Make sure we include all required parameters in the action URL
      // This ensures the missed-call endpoint has all the data it needs
      // IMPORTANT: Use absolute URL to avoid issues with relative paths
      const actionUrl = `${baseUrl}/api/missed-call?From=${encodeURIComponent(fromNumber)}&To=${encodeURIComponent(toNumber)}&CallSid=${encodeURIComponent(CallSid)}&CallStatus=completed`;
      
      // Force the action URL to be absolute by using the full baseUrl
      const dial = twiml.dial({
        action: actionUrl,
        method: 'POST',
        callerId: toNumber,
        timeout: 20
      });
      dial.number(forwardingNumber);
      
      console.log(`🔗 Dial action URL set to: ${actionUrl}`);
      
      // Verify the TwiML output to ensure the action URL is set correctly
      const dialXml = dial.toString();
      console.log(`🔍 Dial XML: ${dialXml}`);
    } else {
      // If no forwarding number, we still need to trigger the missed-call endpoint
      // Add a redirect to ensure the missed-call flow is triggered
      // IMPORTANT: Use absolute URL to avoid issues with relative paths
      const redirectUrl = `${baseUrl}/api/missed-call?From=${encodeURIComponent(fromNumber)}&To=${encodeURIComponent(toNumber)}&CallSid=${encodeURIComponent(CallSid)}&CallStatus=no-answer`;
      
      twiml.pause({ length: 1 });
      twiml.redirect({
        method: 'POST'
      }, redirectUrl);
      
      console.log(`🔄 Redirect URL set to: ${redirectUrl}`);
    }

    // -----------------------------------------------------------------
    // 6. Send Smarttext auto‑SMS to the caller
    // -----------------------------------------------------------------
    try {
      // Use the TWILIO_PHONE_NUMBER environment variable instead of toNumber
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || toNumber;
      
      // Use custom auto-reply message if available, otherwise use the standard message
      let messageBody = `Thanks for calling ${businessName}! We missed you, but reply here and we'll get right back to you.`;
      
      // Check if the business has a custom auto-reply message
      if (business?.custom_settings?.autoReplyMessage) {
        messageBody = business.custom_settings.autoReplyMessage;
      } else if (business?.customSettings?.autoReplyMessage) {
        messageBody = business.customSettings.autoReplyMessage;
      }
      
      await sendSms({
        to: fromNumber,
        from: twilioPhoneNumber, // Use the Twilio phone number from environment
        body: messageBody,
        requestId: CallSid
      });
      console.log(`💬 Auto‑text sent to caller: "${messageBody}"`);
    } catch (smsErr: any) {
      console.error('⚠️ Failed to send auto‑text:', smsErr.message);
    }

    // -----------------------------------------------------------------
    // 7. Return TwiML (HTTP 200 so Twilio won't retry)
    // -----------------------------------------------------------------
    const twimlString = twiml.toString();
    console.log(`📄 Final TwiML response:`, twimlString);
    
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twimlString);
  } catch (error: any) {
    // -----------------------------------------------------------------
    // 8. Fallback error TwiML (still HTTP 200 per your preference)
    // -----------------------------------------------------------------
    console.error('❌ Voice handler error:', error.message);
    console.error('Stack trace:', error.stack);

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      { voice: 'alice' },
      "We're sorry, but we encountered an error processing your call. Please try again later."
    );

    const errorTwimlString = twiml.toString();
    console.log(`📄 Error TwiML response:`, errorTwimlString);

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(errorTwimlString);
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
