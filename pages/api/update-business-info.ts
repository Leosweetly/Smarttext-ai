import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
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
      customAutoTextMessage, // New field for custom auto-text message
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

    // Convert fields to Supabase format
    const supabaseFields: {
      name: string | number;
      public_phone: string | number;
      business_type: string | number;
      hours_json: string | number;
      website: string | number;
      team_size: string | number;
      address: string | number;
      email: string | number;
      online_ordering_link: any;
      reservation_link: any;
      faqs_json: any;
      custom_settings?: Record<string, any>;
    } = {
      name: fields['Business Name'],
      public_phone: fields['Phone Number'],
      business_type: fields['Industry'],
      hours_json: fields['Hours JSON'],
      website: fields['Website'],
      team_size: fields['Team Size'],
      address: fields['Address'],
      email: fields['Email'],
      online_ordering_link: onlineOrderingLink || null,
      reservation_link: reservationLink || null,
      faqs_json: faqs || null
    };
    
    // Add custom auto-text message to custom_settings if provided
    if (customAutoTextMessage) {
      // Get existing custom_settings or create a new object
      let customSettings = {};
      
      // If this is an update to an existing record, fetch the current custom_settings
      if (recordId) {
        const { data, error } = await supabase
          .from('businesses')
          .select('custom_settings')
          .eq('id', recordId)
          .single();
          
        if (!error && data && data.custom_settings) {
          customSettings = data.custom_settings;
        }
      }
      
      // Update the custom_settings with the new auto-text message
      customSettings = {
        ...customSettings,
        autoReplyMessage: customAutoTextMessage
      };
      
      // Add the updated custom_settings to the supabaseFields
      supabaseFields.custom_settings = customSettings;
    }

    let record;

    // context: Update existing or create new record
    if (recordId) {
      const { data, error } = await supabase
        .from('businesses')
        .update(supabaseFields)
        .eq('id', recordId)
        .select()
        .single();
        
      if (error) throw error;
      record = data;
    } else {
      const { data, error } = await supabase
        .from('businesses')
        .insert(supabaseFields)
        .select()
        .single();
        
      if (error) throw error;
      record = data;
    }

    return res.status(200).json({ success: true, id: record.id, data: req.body });
  } catch (err: any) {
    console.error('[update-business-info] Error:', err.message);
    console.error('[update-business-info] Stack:', err.stack);

    // context: Custom Supabase + general error handling
    if (err.code === 'PGRST116' || err.message?.includes('invalid api key')) {
      return res.status(401).json({ error: 'Invalid Supabase API key', code: 'INVALID_API_KEY', details: err.message });
    } else if (err.code === '42P01' || err.message?.includes('not found')) {
      return res.status(404).json({ error: 'Table or record not found', code: 'NOT_FOUND', details: err.message });
    } else if (err.code === '42501' || err.message?.includes('permission')) {
      return res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED', details: err.message });
    } else if (err.code === '429' || err.message?.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED', details: err.message });
    }

    return res.status(500).json({ error: err.message || 'Server error', code: err.error || 'UNKNOWN_ERROR' });
  }
}
