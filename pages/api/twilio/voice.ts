import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { getBusinessByPhoneNumber } from '../../../lib/airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('✅ Twilio voice webhook hit!', {
    body: req.body,
    timestamp: new Date().toISOString()
  });

  try {
    const { To, From, CallSid } = req.body;

    if (!To || !From) {
      console.error('❌ Missing To or From in Twilio webhook');
      return res.status(400).json({ error: 'Missing To or From in Twilio webhook' });
    }

    console.log(`📞 Incoming call from ${From} to ${To} (CallSid: ${CallSid})`);

    const business = await getBusinessByPhoneNumber(To);
    const businessName = business?.name || 'our business';
    
    // Get the forwarding number if available
    const forwardingNumber = business?.customSettings?.forwardingNumber;
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (forwardingNumber) {
      console.log(`📞 Forwarding call to ${forwardingNumber}`);
      
      // Use Dial with action to forward the call and capture the status
      const dial = twiml.dial({
        action: '/api/missed-call', // This will be called after the call ends with To, From, and CallStatus
        callerId: To // Show the business number as the caller ID
      });
      
      dial.number(forwardingNumber);
    } else {
      // No forwarding number, so just play a message
      twiml.say(
        { voice: 'alice' },
        `Hey, thanks for calling ${businessName}, we're currently unavailable but we will text you shortly.`
      );
      
      // Add a Dial with action but no number to capture the call status
      // This ensures the action URL gets called with the proper parameters
      twiml.dial({
        action: '/api/missed-call'
      });
    }

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());

  } catch (error: any) {
    console.error('❌ Voice handler error:', error.message);

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      { voice: 'alice' },
      'We\'re sorry, but we encountered an error processing your call. Please try again later.'
    );

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  }
}
