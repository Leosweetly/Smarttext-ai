import type { NextApiRequest, NextApiResponse } from 'next';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import { parse } from 'querystring';

// Disable Next.js body parser to handle raw request body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Log all call status events for debugging
  console.log('📊 Call status webhook hit!', {
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
      
      // Validate Twilio request signature in production
      if (process.env.NODE_ENV === 'production') {
        const twilioSignature = req.headers['x-twilio-signature'] as string;
        const webhookUrl = process.env.WEBHOOK_BASE_URL 
          ? `${process.env.WEBHOOK_BASE_URL}/api/twilio/call-status` 
          : `https://${req.headers.host}/api/twilio/call-status`;
          
        console.log('🔐 Validating Twilio signature:', {
          signature: twilioSignature ? 'present' : 'missing',
          webhookUrl
        });
        
        // Parse the raw body for validation
        const params = parse(rawBody);
        
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
    
    // Extract data from Twilio webhook
    const {
      CallSid,
      CallStatus,
      CallDuration,
      From,
      To,
      Direction,
      DialCallStatus,
      DialCallDuration,
      DialCallSid
    } = body;

    // Create a structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      callSid: CallSid,
      callStatus: CallStatus,
      callDuration: CallDuration,
      from: From,
      to: To,
      direction: Direction,
      dialCallStatus: DialCallStatus,
      dialCallDuration: DialCallDuration,
      dialCallSid: DialCallSid
    };

    // Log the call status event
    console.log(`📞 Call status update: ${CallStatus} for call from ${From} to ${To}`, logEntry);

    // If the call was not answered, we'll let the missed-call webhook handle it
    if (DialCallStatus === 'no-answer' || DialCallStatus === 'busy' || DialCallStatus === 'failed') {
      console.log(`ℹ️ Call was not answered (${DialCallStatus}). The missed-call webhook will handle sending an SMS.`);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Call status logged successfully',
      callSid: CallSid,
      callStatus: CallStatus
    });

  } catch (err: any) {
    console.error(`❌ Error in call status webhook:`, err.message);
    console.error(`Stack:`, err.stack);

    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
