import type { NextApiRequest, NextApiResponse } from 'next';
import { getTable } from '../../lib/data/airtable-client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // context: Allow local dev + production frontend calls
  const allowedOrigins = ['http://localhost:8080', 'https://www.getsmarttext.com', 'https://smarttext-ai.vercel.app'];
  const origin = req.headers.origin as string;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
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
      faqs,
      recordId,
    } = req.body;

    // context: Required fields validation
    if (!name || !industry || !phoneNumber || !hoursJson) {
      const missingFields: string[] = [];
      if (!name) missingFields.push('name');
      if (!phoneNumber) missingFields.push('phoneNumber');
      if (!industry) missingFields.push('industry');
      if (!hoursJson) missingFields.push('hoursJson');

      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields,
        message: `The following required fields are missing: ${missingFields.join(', ')}`
      });
    }

    // context: Parse team size safely
    const parsedTeamSize = teamSize ? parseInt(teamSize, 10) : undefined;

    // context: Clean and validate phone number using libphonenumber-js
    let cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    let finalPhoneNumber = phoneNumber; // fallback

    const parsedPhone = parsePhoneNumberFromString(phoneNumber, 'US'); // assuming US for now
    if (parsedPhone && parsedPhone.isValid()) {
      finalPhoneNumber = parsedPhone.number; // E.164 format, e.g., +16193721633
    } else if (cleanedPhoneNumber.length === 10) {
      finalPhoneNumber = `+1${cleanedPhoneNumber}`; // fallback if they forgot country code
    }

    const fields: Record<string, string | number> = {
      'Business Name': name,
      'Phone Number': finalPhoneNumber,
      'Industry': industry,
      'Hours JSON': hoursJson,
      'Website': website || '',
      'Team Size': parsedTeamSize || 0,
      'Address': address || '',
      'Email': email || '',
    };

    // context: Handle FAQs field, safe stringify
    if (faqs) {
      fields['FAQs'] = typeof faqs === 'string' ? faqs : JSON.stringify(faqs);
    }

    // context: Industry-specific fields
    if (industry === 'restaurant') {
      if (onlineOrderingLink) fields['Online Ordering Link'] = onlineOrderingLink;
      if (reservationLink) fields['Reservation Link'] = reservationLink;
    }

    const table = getTable('Businesses');
    let record;

    // context: Update existing or create new record
    if (recordId) {
      record = await table.update(recordId, fields);
    } else {
      record = await table.create(fields);
    }

    return res.status(200).json({ success: true, id: record.id, data: req.body });
  } catch (err: any) {
    console.error('[update-business-info] Error:', err.message);
    console.error('[update-business-info] Stack:', err.stack);

    // context: Custom Airtable + general error handling
    if (err.error === 'INVALID_API_KEY' || err.message?.includes('invalid api key')) {
      return res.status(401).json({ error: 'Invalid Airtable API key', code: 'INVALID_API_KEY', details: err.message });
    } else if (err.error === 'NOT_FOUND' || err.message?.includes('not found')) {
      return res.status(404).json({ error: 'Table or record not found', code: 'NOT_FOUND', details: err.message });
    } else if (err.error === 'PERMISSION_DENIED' || err.message?.includes('permission')) {
      return res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED', details: err.message });
    } else if (err.message?.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED', details: err.message });
    }

    return res.status(500).json({ error: err.message || 'Server error', code: err.error || 'UNKNOWN_ERROR' });
  }
}