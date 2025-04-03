// API endpoint for updating business information
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
  process.env.AIRTABLE_BASE_ID || ''
);
const table = base('Businesses');

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Handle POST only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, industry, size, website } = req.body;

    if (!name || !industry || !size) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const record = await table.create({
      fields: {
        Name: name,
        Industry: industry,
        Size: size,
        Website: website || '',
      },
    });

    return res.status(200).json({ success: true, id: record.id });
  } catch (error) {
    console.error('Error updating business info:', error);
    return res.status(500).json({ error: error.message });
  }
}