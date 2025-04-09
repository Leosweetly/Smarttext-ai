import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('✅ Twilio webhook hit!', req.body);

  const incomingMessage = req.body.Body;
  const fromNumber = req.body.From;

  console.log(`📲 Incoming SMS from ${fromNumber}: ${incomingMessage}`);

  // Respond back to Twilio
  const twiml = `
    <Response>
      <Message>Hi! We received your message: "${incomingMessage}". We'll get back to you shortly!</Message>
    </Response>
  `;

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}