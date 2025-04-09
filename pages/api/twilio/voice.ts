import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { getBusinessByPhoneNumber } from '../../../lib/airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('✅ Twilio voice webhook hit!', {
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  try {
    // Extract data from Twilio webhook
    const { To, From, CallSid } = req.body;

    if (!To || !From) {
      console.error('❌ Missing required fields in Twilio voice webhook');
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'The Twilio webhook must include To and From fields'
      });
    }

    console.log(`📞 Incoming call from ${From} to ${To} (CallSid: ${CallSid})`);

    // Look up the business by phone number
    const business = await getBusinessByPhoneNumber(To);

    // Initialize Twilio response
    const twiml = new twilio.twiml.VoiceResponse();

    // If no business found, play a generic message
    if (!business) {
      console.error(`❌ No business found with phone number ${To}`);
      twiml.say(
        { voice: 'alice' },
        'We\'re sorry, but this number is not associated with a business. Please check the number and try again.'
      );
      
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());
    }

    console.log(`✅ Found business: ${business.name} (${business.id})`);

    // Check if the business has a forwarding number
    const forwardingNumber = business.customSettings?.forwardingNumber;
    
    if (!forwardingNumber) {
      console.error(`❌ No forwarding number found for business ${business.id}`);
      twiml.say(
        { voice: 'alice' },
        `Thank you for calling ${business.name}. We're unable to connect your call at this time. Please try again later.`
      );
      
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());
    }

    console.log(`📞 Forwarding call to ${forwardingNumber}`);

    // Forward the call to the business's forwarding number
    const dial = twiml.dial({
      callerId: To, // Use the Twilio number as the caller ID
      timeout: 20,  // Ring for 20 seconds before considering it a missed call
      action: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://smarttext-ai.vercel.app'}/api/twilio/call-status`,
      method: 'POST'
    });
    
    dial.number(forwardingNumber);

    // Set response headers and send TwiML
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());

  } catch (err: any) {
    console.error(`❌ Error in voice webhook:`, err.message);
    console.error(`Stack:`, err.stack);

    // Return a TwiML response even in case of error
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      { voice: 'alice' },
      'We\'re sorry, but we encountered an error processing your call. Please try again later.'
    );

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }
}
