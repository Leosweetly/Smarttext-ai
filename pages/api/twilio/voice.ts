import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { getBusinessByPhoneNumber } from '../../../lib/airtable';
import { sendSms } from '../../../lib/twilio'; // Import from the TypeScript file

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

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      { voice: 'alice' },
      `Hey, thanks for calling ${businessName}, we're currently unavailable but we will text you shortly.`
    );
    twiml.hangup();

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());

    // ✅ After voice response, send instant SMS to the caller
    console.log('📲 Sending instant SMS to caller...');
    await sendSms({
      to: From,
      from: To,
      body: `Thanks for calling ${businessName}! We're busy helping other customers at the moment. Were you calling about general information like our hours, website, etc?`
    });

    console.log('✅ SMS sent successfully to caller:', From);

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
