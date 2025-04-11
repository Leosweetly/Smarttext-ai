import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import { getBusinessByPhoneNumber, logMissedCall, logCallToCallLogs, getTable } from '../../lib/airtable';
import { generateMissedCallResponse } from '../../lib/openai';
import { parse } from 'querystring';

// Before anything, parse the body from Twilio webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[debug] raw req.headers', req.headers);
  console.log('[debug] typeof req.body', typeof req.body, req.body);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('✅ Missed call webhook hit!', {
    body: req.body,
    query: req.query,
    headers: req.headers,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  try {
    // Parse the request body
    let body: Record<string, any> = {};
    let rawBody = '';

    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      // Collect request body data
      for await (const chunk of req) {
        rawBody += chunk.toString();
      }
      
      // Validate Twilio request signature in production
      if (process.env.NODE_ENV === 'production') {
        const twilioSignature = req.headers['x-twilio-signature'] as string;
        const webhookUrl = process.env.WEBHOOK_BASE_URL 
          ? `${process.env.WEBHOOK_BASE_URL}/api/missed-call` 
          : `https://${req.headers.host}/api/missed-call`;
          
        console.log('🔐 Validating Twilio signature:', {
          signature: twilioSignature ? 'present' : 'missing',
          webhookUrl
        });
        
        // Parse the raw body for validation
        const params = parse(rawBody);
        
        const isValidRequest = validateRequest(
          process.env.TWILIO_AUTH_TOKEN || '',
          twilioSignature || '',
          webhookUrl,
          params
        );
        
        if (!isValidRequest) {
          console.error('❌ Invalid Twilio signature');
          return res.status(403).json({
            error: 'Invalid signature',
            message: 'Could not validate that this request came from Twilio'
          });
        }
        
        console.log('✅ Twilio signature validated successfully');
      } else {
        console.log('⚠️ Skipping Twilio signature validation in development');
      }
      
      // Parse the form data
      body = parse(rawBody) as Record<string, any>;
    } else {
      body = req.body || {};
    }

    console.log('📨 Parsed Twilio webhook body:', body);
    
    // Log raw body for debugging
    console.log('📨 Raw body keys:', Object.keys(body));
    console.log('📨 Content-Type:', req.headers['content-type']);

    // Extract data from Twilio webhook
    const To = body.To as string;
    const From = body.From as string;
    const CallSid = body.CallSid as string;
    const CallStatus = body.CallStatus as string;

    if (!To || !From || !CallStatus) {
      console.error('❌ Missing required fields in missed call webhook');
      console.error('❌ To:', To);
      console.error('❌ From:', From);
      console.error('❌ CallStatus:', CallStatus);
      console.error('❌ All fields:', JSON.stringify(body));
      
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'The webhook must include To, From, and CallStatus fields'
      });
    }

    // Add the requested logging
    console.log('Missed call from:', From, 'Status:', CallStatus);
    console.log(`📞 Call status update: ${CallStatus} for call from ${From} to ${To} (CallSid: ${CallSid})`);
    
    // Log the call to the Calls table in Airtable
    try {
      const callsTable = getTable("Calls");
      const callRecord = await callsTable.create({
        "From": From,
        "To": To,
        "Call Status": CallStatus,
        "Call SID": CallSid,
        "Timestamp": new Date().toISOString()
      });
      console.log(`✅ Successfully logged call to Calls table, record ID: ${callRecord.id}`);
    } catch (airtableError) {
      console.error(`❌ Failed to log call to Calls table:`, airtableError);
      // Don't throw the error to avoid interrupting the flow
    }

    // Only process missed calls (no-answer, busy, or failed status)
    if (CallStatus !== 'no-answer' && CallStatus !== 'busy' && CallStatus !== 'failed') {
      console.log(`ℹ️ Ignoring call with status: ${CallStatus}`);
      return res.status(200).json({
        success: true,
        message: `Call status ${CallStatus} does not require SMS follow-up`
      });
    }

    // Look up the business by phone number
    const business = await getBusinessByPhoneNumber(To);

    // If no business found, log and return
    if (!business) {
      console.error(`❌ No business found with phone number ${To}`);
      return res.status(404).json({
        error: 'Business not found',
        message: `No business found with phone number ${To}`
      });
    }

    console.log(`✅ Found business: ${business.name} (${business.id})`);

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // TODO: Enhance SMS auto-reply to missed caller with more personalized messages
    // based on business type, time of day, and previous interaction history.
    
    // Create the friendly SMS reply with business name
    const messageBody = `Thanks for calling ${business.name}! We're busy helping other customers at the moment. Were you calling about general information like our hours, website, etc?`;
    console.log(`✅ Using friendly message: "${messageBody}"`);

    // Send the SMS to the caller using the sendSms function
    const { sendSms } = require('../../lib/twilio');
    const message = await sendSms({
      body: messageBody,
      from: To,
      to: From,
      requestId: CallSid
    });

    console.log(`✅ Sent SMS to ${From}, message SID: ${message.sid}`);

    // Try to get the business owner's phone number from Airtable
    let ownerPhoneNumber: string | undefined = undefined;
    let notificationSent = false;
    
    // Check if the business record has an owner phone number
    // Note: This assumes there's an "Owner Phone" field in the Airtable schema
    // If it doesn't exist, it will always use the fallback
    if (business.customSettings && business.customSettings.ownerPhone) {
      ownerPhoneNumber = business.customSettings.ownerPhone;
      console.log(`✅ Owner number from Airtable: ${ownerPhoneNumber}`);
    } else {
      // Use fallback number from environment variables
      const fallbackOwnerNumber = process.env.OWNER_FALLBACK_PHONE_NUMBER;
      
      if (fallbackOwnerNumber) {
        ownerPhoneNumber = fallbackOwnerNumber;
        console.log(`🚨 Fallback owner number used: ${fallbackOwnerNumber}`);
      } else {
        console.log(`⚠️ No owner number available, skipping notification SMS.`);
      }
    }

    // Send notification to the business owner if we have their number
    if (ownerPhoneNumber) {
      try {
        const ownerMessage = await sendSms({
          body: `You received a missed call from ${From}. Call status: ${CallStatus}`,
          from: To,
          to: ownerPhoneNumber,
          requestId: `${CallSid}-owner`
        });
        
        console.log(`✅ Sent notification to business owner at ${ownerPhoneNumber}, message SID: ${ownerMessage.sid}`);
        notificationSent = true;
      } catch (notificationError) {
        console.error(`❌ Failed to send notification to business owner:`, notificationError);
      }
    } else {
      console.log(`ℹ️ Skipping owner notification due to missing phone number`);
    }

    // Log the missed call to Airtable
    try {
      await logMissedCall({
        callerNumber: From,
        businessNumber: To,
        businessId: business.id,
        callStatus: CallStatus,
        ownerNotified: notificationSent
      });
    } catch (airtableError) {
      // Just log the error but don't interrupt the flow
      console.error(`❌ Failed to log missed call to Airtable:`, airtableError);
    }

    // Log the call to the Call Logs table for analytics
    try {
      await logCallToCallLogs({
        businessName: business.name,
        callerNumber: From,
        ownerNumber: ownerPhoneNumber || "",
        callStatus: "Missed Call",
        notes: "Auto-logged from SmartText missed call flow"
      });
      console.log(`✅ Successfully logged call to Call Logs table for analytics`);
    } catch (airtableError) {
      // Just log the error but don't interrupt the flow
      console.error(`❌ Failed to log call to Call Logs table:`, airtableError);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: messageBody,
      messageSid: message.sid,
      callSid: CallSid,
      callStatus: CallStatus,
      ownerNotificationSent: notificationSent
    });

  } catch (err: any) {
    console.error(`❌ Error in missed call webhook:`, err.message);
    console.error(`Stack:`, err.stack);

    // Handle specific errors
    if (err.message?.includes('invalid api key')) {
      return res.status(401).json({ error: 'Invalid Airtable API key', details: err.message });
    } else if (err.message?.includes('not found')) {
      return res.status(404).json({ error: 'Table or record not found', details: err.message });
    } else if (err.message?.includes('permission')) {
      return res.status(403).json({ error: 'Permission denied', details: err.message });
    } else if (err.message?.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded', details: err.message });
    }

    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
