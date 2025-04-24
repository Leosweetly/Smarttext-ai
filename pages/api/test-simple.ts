import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { sendSms } from '../../lib/twilio';

/**
 * Simple test endpoint for testing the missed call → auto-text flow
 * 
 * This endpoint is designed to be easy to test with both JSON and form-urlencoded requests.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📞 Simple test endpoint hit');
  console.log('🔍 Request headers:', req.headers);
  console.log('🔍 Request body:', req.body);

  try {
    // Extract parameters from the request body
    const {
      To: toNumber,
      From: fromNumber,
      CallSid: callSid,
      CallStatus: callStatus,
      Direction: direction,
      ConnectDuration: connectDuration
    } = req.body;

    // Validate required parameters
    if (!toNumber || !fromNumber || !callSid) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['To', 'From', 'CallSid'],
        received: req.body
      });
    }

    console.log('📝 Parsed parameters:');
    console.log(`- To: ${toNumber}`);
    console.log(`- From: ${fromNumber}`);
    console.log(`- CallSid: ${callSid}`);
    console.log(`- CallStatus: ${callStatus}`);
    console.log(`- Direction: ${direction}`);
    console.log(`- ConnectDuration: ${connectDuration}`);

    // Check if this is a missed call (no-answer or busy)
    const isMissedCall = callStatus === 'no-answer' || callStatus === 'busy';
    const isConnected = connectDuration && parseInt(connectDuration) > 0;

    console.log(`📊 Call analysis: isMissedCall=${isMissedCall}, isConnected=${isConnected}`);

    // For testing, we'll mock the call event logging
    console.log('📊 Would log call event to Supabase:');
    console.log({
      call_sid: callSid,
      from_number: fromNumber,
      to_number: toNumber,
      call_status: callStatus,
      direction: direction,
      connect_duration: connectDuration,
      event_type: isMissedCall ? 'missed' : 'completed'
    });

    // Only send auto-text for missed calls
    if (isMissedCall && !isConnected) {
      console.log('📱 Sending auto-text for missed call');

      // Look up the business by phone number
      // For testing purposes, we'll mock a business
      const business = {
        id: 'test-business-id',
        name: 'Test Business',
        custom_settings: {
          autoReplyMessage: 'Thanks for calling Test Business! We\'ll get back to you as soon as possible.'
        }
      };
      
      // Skip the actual database lookup for testing
      console.log('✅ Using mock business data for testing');
      const lookupError = null;

      if (lookupError) {
        console.error('❌ Error looking up business:', lookupError);
        return res.status(500).json({ error: 'Error looking up business' });
      }

      if (!business) {
        console.error('❌ Business not found for phone number:', toNumber);
        return res.status(404).json({ error: 'Business not found' });
      }

      console.log('✅ Found business:', business.name);

      // Get the auto-reply message
      let autoReplyMessage = 'Thanks for calling! We\'ll get back to you as soon as possible.';
      
      if (business.custom_settings && business.custom_settings.autoReplyMessage) {
        autoReplyMessage = business.custom_settings.autoReplyMessage;
        console.log('📝 Using custom auto-reply message:', autoReplyMessage);
      }

      // Send the SMS
      try {
        const messageSid = `TEST_MSG_${Date.now()}`;
        
        // For testing, we'll mock the SMS event logging
        console.log('📊 Would log SMS event to Supabase:');
        console.log({
          message_sid: messageSid,
          from_number: toNumber,
          to_number: fromNumber,
          body: autoReplyMessage,
          direction: 'outbound',
          status: 'sent',
          request_id: callSid
        });

        // In a real environment, we would call Twilio here
        // For testing, we'll just log the SMS
        console.log('📱 Would send SMS:');
        console.log(`- From: ${toNumber}`);
        console.log(`- To: ${fromNumber}`);
        console.log(`- Body: ${autoReplyMessage}`);

        // Log the event to monitoring (disabled for testing)
        console.log('📊 Would log monitoring event: auto_text_sent');

        return res.status(200).json({
          success: true,
          message: 'Auto-text sent successfully',
          smsResponse: {
            messageSid,
            from: toNumber,
            to: fromNumber,
            body: autoReplyMessage
          }
        });
      } catch (error) {
        console.error('❌ Error sending SMS:', error);
        return res.status(500).json({ error: 'Error sending SMS' });
      }
    } else {
      console.log('📱 No auto-text needed (call was connected or not missed)');
      return res.status(200).json({
        success: true,
        message: 'Call logged successfully',
        connected: isConnected,
        missed: isMissedCall
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
