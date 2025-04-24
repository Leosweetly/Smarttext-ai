import type { NextApiRequest, NextApiResponse } from 'next';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import { parse } from 'querystring';
import twilio from 'twilio';

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
          return res.status(403).json({
            error: 'Invalid signature',
            message: 'Could not validate that this request came from Twilio'
          });
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

    console.log(`📲 Incoming SMS from ${fromNumber}: ${incomingMessage}`);

    // Create TwiML response
    const twimlResponse = new twilio.twiml.MessagingResponse();
    twimlResponse.message(`Hi! We received your message: "${incomingMessage}". We'll get back to you shortly!`);

    // Respond back to Twilio
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twimlResponse.toString());
  } catch (err: any) {
    console.error(`❌ Error in SMS webhook:`, err.message);
    console.error(`Stack:`, err.stack);

    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
