import { NextApiRequest, NextApiResponse } from 'next';
import { getBusinessById } from '../../lib/airtable';

// Initialize Airtable for logging
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { userId, event, data } = req.body;

    if (!userId || !event) {
      return res.status(400).json({
        error: 'Missing required parameters: userId, event'
      });
    }

    // Get the business from Airtable
    const business = await getBusinessById(userId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Log the subscription event
    await logSubscriptionEvent(userId, {
      action: event,
      timestamp: new Date().toISOString(),
      details: data || {}
    });

    // Return success
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error logging subscription event:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Log a subscription event to Airtable
 * @param {string} userId - The business ID
 * @param {Object} eventData - The event data to log
 */
async function logSubscriptionEvent(userId: string, eventData: any) {
  try {
    // Log to console for debugging
    console.log(`Subscription event for user ${userId}:`, eventData);
    
    // Get the Airtable table
    const Airtable = require('airtable');
    const base = new Airtable({ apiKey: AIRTABLE_PAT }).base(AIRTABLE_BASE_ID);
    const table = base('Subscription Events');
    
    // Create a record in the Subscription Events table
    await table.create({
      'Business ID': userId,
      'Event Type': eventData.action,
      'Timestamp': eventData.timestamp,
      'Details': JSON.stringify(eventData.details || {})
    });
    
    return true;
  } catch (error) {
    console.error('Error logging subscription event to Airtable:', error);
    // Log the error but don't throw, to prevent API failures
    return false;
  }
}
