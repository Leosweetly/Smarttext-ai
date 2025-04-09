import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('✅ Incoming SMS webhook from Twilio:', req.body);

    const incomingMessage = req.body.Body;
    const fromNumber = req.body.From;

    console.log(`📩 Message from ${fromNumber}: ${incomingMessage}`);

    // Respond to Twilio with a basic message (must be XML!)
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(`
      <Response>
        <Message>Thanks for your message! We'll get back to you shortly.</Message>
      </Response>
    `);
  } catch (error: any) {
    console.error('❌ Error handling incoming SMS:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}