import type { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);
const table = base('Businesses');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.getsmarttext.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, industry, size, website, recordId } = req.body;

    if (!name || !industry || !size) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const recordData: any = {
      Name: name,
      Industry: industry,
      Size: size,
    };
    if (website) recordData.Website = website;

    let record;
    if (recordId) {
      record = await table.update(recordId, { fields: recordData });
    } else {
      record = await table.create({ fields: recordData });
    }

    return res.status(200).json({ success: true, id: record.id });
  } catch (err: any) {
    console.error('[update-business-info] Error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}