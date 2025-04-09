import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('✅ Airtable sync webhook hit!', req.body);

    // TODO: Here we can process and sync the data.
    // For now, just respond to Zapier to confirm
    res.status(200).json({ success: true, message: 'Webhook received', data: req.body });
  } catch (error: any) {
    console.error('Error processing Airtable sync:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}