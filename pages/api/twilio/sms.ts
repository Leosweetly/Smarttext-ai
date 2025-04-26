import type { NextApiRequest, NextApiResponse } from 'next';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import { parse } from 'querystring';
import twilio from 'twilio';
import { getBusinessByPhoneNumberSupabase } from '../../../lib/supabase';
import { handleIncomingSms } from '../../../lib/openai';

// Disable Next.js body parser to handle raw request body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('✅ Twilio SMS webhook hit!', {
    body: req.body,
    query: req.query,
    headers: req.headers,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  try {
    // Parse the request body
    let body: Record<string, any> = {};
    let rawBody = '';

    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      // Collect request body data
      for await (const chunk of req) {
        rawBody += chunk.toString();
      }
      
      // Validate Twilio request signature in production (unless explicitly skipped)
      const isTestEnv = process.env.NODE_ENV !== 'production' || process.env.SKIP_TWILIO_SIGNATURE === 'true';
      
      if (!isTestEnv) {
        const twilioSignature = req.headers['x-twilio-signature'] as string;
        // More robust URL construction with consistent format
        const webhookUrl = process.env.WEBHOOK_BASE_URL 
          ? `${process.env.WEBHOOK_BASE_URL.replace(/\/+$/, '')}/api/twilio/sms` 
          : `https://${req.headers.host}/api/twilio/sms`;
          
        // Parse the raw body for validation
        const params = parse(rawBody);
        
        // Enhanced logging for debugging
        console.log('🔐 Validating Twilio signature:', {
          authToken: process.env.TWILIO_AUTH_TOKEN ? 'present (redacted)' : 'missing',
          signature: twilioSignature ? 'present' : 'missing',
          webhookUrl,
          paramCount: Object.keys(params).length
        });
        
        const isValidRequest = validateRequest(
          process.env.TWILIO_AUTH_TOKEN || '',
          twilioSignature || '',
          webhookUrl,
          params
        );
        
        if (!isValidRequest) {
          console.error('❌ Invalid Twilio signature');
          
          // Create an error TwiML response instead of JSON
          const errorTwiml = new twilio.twiml.MessagingResponse();
          errorTwiml.message("Invalid request signature. This request could not be verified as coming from Twilio.");
          
          // Force-set header after TwiML is built and before any body is written
          res.writeHead(403, { 'Content-Type': 'text/xml' });
          return res.end(errorTwiml.toString());
        }
        
        console.log('✅ Twilio signature validated successfully');
      } else {
        console.log('⚠️ Skipping Twilio signature validation in development');
      }
      
      // Parse the form data
      body = parse(rawBody) as Record<string, any>;
    } else {
      body = req.body || {};
    }

    console.log('📨 Parsed Twilio webhook body:', body);
    
    const incomingMessage = body.Body;
    const fromNumber = body.From;
    const toNumber = body.To;

    console.log(`📲 Incoming SMS from ${fromNumber} to ${toNumber}: ${incomingMessage}`);

    // Create TwiML response
    const twimlResponse = new twilio.twiml.MessagingResponse();
    
    try {
      // Look up the business by phone number
      const business = await getBusinessByPhoneNumberSupabase(toNumber);
      
      if (!business) {
        console.warn(`❌ No business found for phone number: ${toNumber}`);
        twimlResponse.message(`We're sorry, but we couldn't identify the business you're trying to reach.`);
      } else {
        console.log(`✅ Found business: ${business.name} (${business.id})`);
        
        // Use our new handleIncomingSms function to generate a response
        const response = await handleIncomingSms(business);
        
        // Add the response to the TwiML
        twimlResponse.message(response);
        
        console.log(`✅ Generated response: "${response}"`);
      }
    } catch (error) {
      console.error(`❌ Error generating response:`, error);
      twimlResponse.message(`We're sorry, but we encountered an error processing your message. Please try again later.`);
    }

    // Respond back to Twilio
    // Force-set header after TwiML is built and before any body is written
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twimlResponse.toString());
  } catch (err: any) {
    console.error(`❌ Error in SMS webhook:`, err.message);
    console.error(`Stack:`, err.stack);

    // Create an error TwiML response instead of JSON
    const errorTwiml = new twilio.twiml.MessagingResponse();
    errorTwiml.message("We're sorry, but we encountered an error processing your message. Please try again later.");
    
    // Force-set header after TwiML is built and before any body is written
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(errorTwiml.toString());
  }
}
