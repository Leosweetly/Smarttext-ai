import { NextApiRequest, NextApiResponse } from 'next';
import { getBusinessByIdSupabase } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

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

    // Get the business from Supabase
    const business = await getBusinessByIdSupabase(userId);
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
 * Log a subscription event to Supabase
 * @param {string} userId - The business ID
 * @param {Object} eventData - The event data to log
 */
async function logSubscriptionEvent(userId: string, eventData: any) {
  try {
    // Log to console for debugging
    console.log(`Subscription event for user ${userId}:`, eventData);
    
    // Create a record in the subscription_events table
    const { data, error } = await supabase
      .from('subscription_events')
      .insert({
        business_id: userId,
        event_type: eventData.action,
        timestamp: eventData.timestamp,
        details: eventData.details || {}
      });
    
    if (error) {
      console.error('Error logging subscription event to Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error logging subscription event to Supabase:', error);
    // Log the error but don't throw, to prevent API failures
    return false;
  }
}
