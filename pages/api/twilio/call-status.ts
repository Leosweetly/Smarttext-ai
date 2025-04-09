import type { NextApiRequest, NextApiResponse } from 'next';

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
    timestamp: new Date().toISOString()
  });

  try {
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
    } = req.body;

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
