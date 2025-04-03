// API endpoint for updating business information
import Airtable from 'airtable';

// Initialize Airtable with Personal Access Token
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
  process.env.AIRTABLE_BASE_ID || ''
);
const table = base('Businesses');

export default async function handler(req, res) {
  // Set CORS headers for allowed origins
  const allowedOrigins = ['http://localhost:8080', 'https://www.getsmarttext.com'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[api/update-business-info] Received request:', JSON.stringify(req.body));

    const {
      name,
      phoneNumber,
      industry,
      hoursJson,
      website,
      teamSize,
      address,
      email,
      onlineOrderingLink,
      reservationLink,
      recordId
    } = req.body;

    if (!name || !industry || !phoneNumber || !hoursJson) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fields = {
      'Business Name': name,
      'Phone Number': phoneNumber,
      'Industry': industry,
      'Hours JSON': hoursJson,
      'Website': website || '',
      'Team Size': teamSize || '',
      'Address': address || '',
      'Email': email || ''
    };

    // Conditional fields based on industry
    if (industry === 'restaurant') {
      if (onlineOrderingLink) fields['Online Ordering Link'] = onlineOrderingLink;
      if (reservationLink) fields['Reservation Link'] = reservationLink;
    }

    console.log('[api/update-business-info] Fields to save:', fields);

    let record;
    if (recordId) {
      console.log(`[api/update-business-info] Updating record ${recordId}`);
      record = await table.update(recordId, { fields });
    } else {
      console.log('[api/update-business-info] Creating new record');
      record = await table.create({ fields });
    }

    console.log(`[api/update-business-info] Success - record ID: ${record.id}`);
    return res.status(200).json({ success: true, id: record.id });
  } catch (err) {
    console.error('[api/update-business-info] Error:', err.message);
    console.error('[api/update-business-info] Stack:', err.stack);

    // Airtable-specific error handling
    if (err.error === 'INVALID_API_KEY' || err.message?.includes('invalid api key')) {
      return res.status(401).json({
        error: 'Invalid Airtable API key',
        code: 'INVALID_API_KEY',
        details: err.message
      });
    } else if (err.error === 'NOT_FOUND' || err.message?.includes('not found')) {
      return res.status(404).json({
        error: 'Table or record not found',
        code: 'NOT_FOUND',
        details: err.message
      });
    } else if (err.error === 'PERMISSION_DENIED' || err.message?.includes('permission')) {
      return res.status(403).json({
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        details: err.message
      });
    } else if (err.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        details: err.message
      });
    }

    return res.status(500).json({
      error: err.message || 'Server error',
      code: err.error || 'UNKNOWN_ERROR'
    });
  }
}