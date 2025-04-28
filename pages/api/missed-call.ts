import type { NextApiRequest, NextApiResponse } from 'next';
import twilio, { validateRequest } from 'twilio';
import getRawBody from 'raw-body';

// Import the functions we need directly
import { generateMissedCallResponse } from '../../lib/openai';
import { sendSms } from '../../lib/twilio';

// Import from compatibility layer that handles both development and production environments
import { 
  getBusinessByPhoneNumberSupabase, 
  logCallEventSupabase,
  trackSmsEvent, 
  trackOwnerAlert 
} from '../../lib/api-compat';

export const config = {
  api: { bodyParser: false },
};

// -----------------------------------------------------------------------------
// Duplicate prevention (in-memory store)
// -----------------------------------------------------------------------------
// Keep track of processed CallSids to prevent duplicate SMS for the same call
const processedCallSids = new Set<string>();

// Cleanup function to remove CallSids after 5 minutes to prevent memory bloat
function scheduleCallSidCleanup(callSid: string) {
  setTimeout(() => {
    processedCallSids.delete(callSid);
    console.log(`[missed-call] Removed CallSid from tracking: ${callSid}`);
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
}

// -----------------------------------------------------------------------------
// Types & constants
// -----------------------------------------------------------------------------

type TwilioWebhookParams = {
  To: string;
  From: string;
  CallSid: string;
  CallStatus: string;
  ConnectDuration?: string;
  // Additional Twilio parameters that might be present in callbacks
  DialCallStatus?: string;
  Called?: string;
  Caller?: string;
  ParentCallSid?: string;
  [key: string]: any; // Allow any other properties that Twilio might send
};

const MISSED_STATUSES = new Set(["no-answer", "busy", "failed"]);

// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log webhook hit for debugging
  console.log("📞 Missed call webhook hit");
  
  // ---------------------------------------------------------------------------
  // Guard: only POST
  // ---------------------------------------------------------------------------
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // ---------------------------------------------------------------------------
  // Enhanced debugging for troubleshooting
  // ---------------------------------------------------------------------------
  console.log("🔍 Request headers:", req.headers);
  console.log("🔍 Request URL:", req.url);
  console.log("🔍 Request query:", req.query);
  
  // ---------------------------------------------------------------------------
  // Parse body (handling different Content-Types)
  // ---------------------------------------------------------------------------
  const rawBody = await getRawBody(req, { limit: "1mb" });
  console.log("🔍 Raw body:", rawBody.toString());
  
  let params: Partial<TwilioWebhookParams> = {};
  
  // Check Content-Type header
  const contentType = req.headers['content-type'] || '';
  console.log("🔍 Content-Type:", contentType);
  
  if (contentType.includes('application/json')) {
    // Parse JSON body
    try {
      params = JSON.parse(rawBody.toString());
      console.log("📝 Parsed JSON body:", params);
    } catch (err) {
      console.error("❌ Error parsing JSON body:", err);
    }
  } else {
    // Default to form-urlencoded parsing
    params = Object.fromEntries(
      new URLSearchParams(rawBody.toString())
    ) as Partial<TwilioWebhookParams>;
    console.log("📝 Parsed form-urlencoded body:", params);
  }

  // Hydrate req.body so any code that tries to access it directly will work
  (req as any).body = params;

  const {
    To = "",
    From = "",
    CallSid = "",
    CallStatus = "",
    ConnectDuration,
    CallDuration,
    Duration,
  } = params;

  console.log("📝 Parsed Twilio body:", params);
  
  // ---------------------------------------------------------------------------
  // Fallback to query params if body params are missing
  // ---------------------------------------------------------------------------
  const { To: queryTo, From: queryFrom, CallSid: queryCallSid, CallStatus: queryCallStatus, ConnectDuration: queryConnectDuration, CallDuration: queryCallDuration, Duration: queryDuration } = req.query;

  // Extract values from Twilio's standard callback parameters if present
  let callbackTo = "";
  let callbackFrom = "";
  let callbackCallSid = "";
  let callbackCallStatus = "";
  
  // Check for DialCallStatus which is sent by Twilio when a Dial action completes
  if (params.DialCallStatus) {
    callbackCallStatus = params.DialCallStatus as string;
    console.log("🔔 Found DialCallStatus:", callbackCallStatus);
  }
  
  // Check for standard Twilio callback parameters
  if (params.Called) callbackTo = params.Called as string;
  if (params.Caller) callbackFrom = params.Caller as string;
  if (params.ParentCallSid) callbackCallSid = params.ParentCallSid as string;
  
  // Use all possible sources for the final values
  const finalTo = To || callbackTo || (queryTo as string) || "";
  const finalFrom = From || callbackFrom || (queryFrom as string) || "";
  const finalCallSid = CallSid || callbackCallSid || (queryCallSid as string) || "";
  const finalCallStatus = CallStatus || callbackCallStatus || (queryCallStatus as string) || "no-answer"; // Default to no-answer
  const finalConnectDuration = ConnectDuration || (queryConnectDuration as string);
  const finalCallDuration = CallDuration || (queryCallDuration as string);
  const finalDuration = Duration || (queryDuration as string);

  // Debug logs to confirm
  console.log("🧩 Final parsed To:", finalTo);
  console.log("🧩 Final parsed From:", finalFrom);
  console.log("🧩 Final parsed CallSid:", finalCallSid);
  console.log("🧩 Final parsed CallStatus:", finalCallStatus);
  console.log("🧩 Final parsed ConnectDuration:", finalConnectDuration);
  console.log("🧩 Final parsed CallDuration:", finalCallDuration);
  console.log("🧩 Final parsed Duration:", finalDuration);

  // ---------------------------------------------------------------------------
  // Validate required fields (with more detailed error messages)
  // ---------------------------------------------------------------------------
  const missingFields: string[] = [];
  if (!finalTo) missingFields.push("To");
  if (!finalFrom) missingFields.push("From");
  if (!finalCallStatus) missingFields.push("CallStatus");
  
  if (missingFields.length > 0) {
    const errorMessage = `Missing required fields: ${missingFields.join(", ")}`;
    console.error("❌ Validation error:", errorMessage);
    console.error("❌ Request details:", {
      url: req.url,
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: params
    });
    
    return res
      .status(400)
      .json({ 
        error: "Missing required fields",
        message: `The webhook must include To, From, and CallStatus fields`,
        missingFields
      });
  }

  // ---------------------------------------------------------------------------
  // Validate Twilio signature (production only, unless explicitly skipped)
  // ---------------------------------------------------------------------------
  const isTestEnv = process.env.NODE_ENV !== 'production' || process.env.SKIP_TWILIO_SIGNATURE === 'true';

  const shouldValidateSignature =
  process.env.NODE_ENV === 'production' && process.env.SKIP_TWILIO_SIGNATURE !== 'true';

if (shouldValidateSignature) {
  const twilioSignature = req.headers["x-twilio-signature"] as
    | string
    | undefined;


    // More robust URL construction with consistent format
    const webhookUrl = process.env.WEBHOOK_BASE_URL 
      ? `${process.env.WEBHOOK_BASE_URL.replace(/\/+$/, '')}/api/missed-call` 
      : `https://${req.headers.host}/api/missed-call`;

    // Enhanced logging for debugging
    console.log("🔍 Validation attempt with:", {
      authToken: process.env.TWILIO_AUTH_TOKEN ? "present (redacted)" : "missing",
      signature: twilioSignature ? twilioSignature : "missing",
      webhookUrl,
      paramCount: Object.keys(params).length
    });

    const valid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN ?? "",
      twilioSignature ?? "",
      webhookUrl,
      params
    );

    if (!valid) {
      console.log("❌ Invalid Twilio signature");
      console.log("🔍 Signature:", twilioSignature);
      console.log("🔍 Webhook URL:", webhookUrl);
      return res.status(403).json({ error: "Invalid Twilio signature" });
    }
  } else {
    console.log("⚠️ Skipping Twilio signature validation in test environment");
  }

  // ---------------------------------------------------------------------------
  // Determine if call was missed (no-answer or very short duration)
  // ---------------------------------------------------------------------------
  const duration = Number(finalDuration ?? finalCallDuration ?? finalConnectDuration ?? 0);
  console.log('[missed-call] durations', { Duration, CallDuration, ConnectDuration, duration, CallStatus });
  const isMissed =
    finalCallStatus === 'no-answer' ||
    (finalCallStatus === 'completed' && duration <= 10);
  
  if (!isMissed) {
    console.log('[missed-call] NOT missed – skipping SMS', { duration, CallStatus: finalCallStatus });
    return res.status(200).json({ success: true, message: `Status ${finalCallStatus} ignored (duration: ${duration}s)` });
  } else {
    console.log('[missed-call] MISS detected – about to send SMS');
  }

  // ---------------------------------------------------------------------------
  // Business lookup
  // ---------------------------------------------------------------------------
  let business;
  try {
    console.log('[missed-call] About to look up business by phone number:', finalTo);
    business = await getBusinessByPhoneNumberSupabase(finalTo);
    if (!business) {
      console.log('[missed-call] Business not found for phone number:', finalTo);
      return res.status(404).json({ error: "Business not found" });
    }
    console.log(`✅ Business found: ${business.name} (${business.id})`);
  } catch (err) {
    console.error('[missed-call] Error looking up business:', err);
    return res.status(500).json({ error: "Error looking up business", details: err.message });
  }

  // ---------------------------------------------------------------------------
  // Notify owner (if we have a number)
  // ---------------------------------------------------------------------------
  const ownerPhone =
    business.customSettings?.ownerPhone ?? process.env.DEFAULT_OWNER_PHONE;
  let ownerNotificationSent = false;

  console.log('[missed-call] Owner notification check', { 
    ownerPhone: ownerPhone ? 'present' : 'missing',
    autoReplyEnabled: business.autoReplyEnabled || business.customSettings?.autoReplyEnabled || false
  });

  if (ownerPhone) {
    try {
      const fromNumber = process.env.TWILIO_PHONE_NUMBER!;
      console.log('[missed-call] Attempting to send owner notification SMS', {
        to: ownerPhone,
        from: fromNumber,
        requestId: `${finalCallSid}-owner`
      });
      
      const ownerMsg = await sendSms({
        body: `Missed call from ${finalFrom}. Status: ${finalCallStatus}`,
        from: fromNumber,
        to: ownerPhone,
        requestId: `${finalCallSid}-owner`,
      });
      ownerNotificationSent = true;
      console.log('[missed-call] Owner notification SMS sent successfully', { messageSid: ownerMsg.sid });

      await trackOwnerAlert({
        businessId: business.id,
        ownerPhone,
        customerPhone: finalFrom,
        alertType: "missed_call",
        messageContent: ownerMsg.body,
        detectionSource: "twilio_webhook",
        messageSid: ownerMsg.sid,
        delivered: true,
        errorMessage: null,
      });
    } catch (err) {
      await trackOwnerAlert({
        businessId: business.id,
        ownerPhone,
        customerPhone: finalFrom,
        alertType: "missed_call",
        messageContent: `Missed call from ${finalFrom}. Status: ${finalCallStatus}`,
        detectionSource: "twilio_webhook",
        messageSid: "",
        delivered: false,
        errorMessage: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Log call event to Supabase (non-blocking)
  // ---------------------------------------------------------------------------
  logCallEventSupabase({
    callSid: finalCallSid,
    from: finalFrom,
    to: finalTo,
    businessId: business.id,
    eventType: "voice.missed",
    callStatus: finalCallStatus,
    ownerNotified: ownerNotificationSent,
    payload: params,
  }).catch(console.error);

  // ---------------------------------------------------------------------------
  // Auto‑reply SMS (for missed calls and very short calls)
  // ---------------------------------------------------------------------------
  const shouldSendAutoReply = duration <= 10;
  console.log(`🔄 Call duration: ${duration}s, should send auto-reply: ${shouldSendAutoReply}`);
  console.log('[missed-call] Auto-reply check', {
    shouldSendAutoReply,
    autoReplyEnabled: business.autoReplyEnabled || business.customSettings?.autoReplyEnabled || false,
    businessName: business.name,
    businessId: business.id
  });
  
  // Check if this CallSid has already been processed
  if (processedCallSids.has(finalCallSid)) {
    console.log(`[missed-call] Duplicate CallSid detected – skipping SMS: ${finalCallSid}`);
    return res.status(200).json({
      success: true,
      callSid: finalCallSid,
      callStatus: finalCallStatus,
      ownerNotificationSent,
      duplicateDetected: true
    });
  }
  
  // Add the CallSid to the processed set and schedule cleanup
  processedCallSids.add(finalCallSid);
  scheduleCallSidCleanup(finalCallSid);
  
  if (shouldSendAutoReply) {
    console.log(`📱 Preparing to send auto-reply SMS to ${finalFrom}`);
    try {
      // Try to generate a custom response first
      let body;
      try {
        console.log(`🤖 Attempting to generate custom response for ${business.name} (tier: ${business.subscription_tier || 'basic'})`);
        body = await generateMissedCallResponse(business);
        console.log(`✅ Generated custom response: "${body}"`);
      } catch (genErr) {
        console.error(`❌ Error generating custom response:`, genErr);
        body = null;
      }
      
      // Fall back to custom message or default if generation fails
      if (!body) {
        if (business.customSettings?.autoReplyMessage) {
          body = business.customSettings.autoReplyMessage;
          console.log(`📝 Using customSettings.autoReplyMessage: "${body}"`);
        } else if (business.custom_settings?.autoReplyMessage) {
          body = business.custom_settings.autoReplyMessage;
          console.log(`📝 Using custom_settings.autoReplyMessage: "${body}"`);
        } else {
          body = `Hi! Thanks for calling ${business.name}. We missed you but will ring back ASAP.`;
          console.log(`📝 Using default message: "${body}"`);
        }
      }
      
      // Debug log to verify business name and message
      console.log(`🔍 DEBUG: Business name: "${business.name}"`);
      console.log(`🔍 DEBUG: Final message to send: "${body}"`);

      const twilioNumber = process.env.TWILIO_PHONE_NUMBER!;
      console.log(`🚀 Sending SMS from ${twilioNumber} to ${finalFrom}`);
      
      try {
        const sms = await sendSms({
          body,
          from: twilioNumber,
          to: finalFrom,
          requestId: finalCallSid,
          bypassRateLimit: true // Bypass rate limiting to ensure the SMS is sent
        });
        console.log(`[missed-call] SMS sent successfully for CallSid: ${finalCallSid}`);
        console.log('[missed-call] SMS sent to', finalFrom);
        console.log(`📤 Sent auto-reply to ${finalFrom}`, sms);
      
        await trackSmsEvent({
          messageSid: sms.sid,
          from: twilioNumber,
          to: finalFrom,
          businessId: business.id,
          status: sms.status ?? "sent",
          errorCode: null,
          errorMessage: null,
          requestId: finalCallSid,
          bodyLength: body.length,
          payload: { type: "missed_call_auto_reply", callSid: finalCallSid },
        });
      } catch (smsErr) {
        console.error('[missed-call] SMS FAILED', smsErr);
        
        await trackSmsEvent({
          messageSid: "",
          from: twilioNumber,
          to: finalFrom,
          businessId: business.id,
          status: "failed",
          errorCode: smsErr?.code?.toString() ?? "unknown",
          errorMessage: smsErr?.message ?? "Unknown",
          requestId: finalCallSid,
          bodyLength: body.length,
          payload: { type: "missed_call_auto_reply", callSid: finalCallSid, error: smsErr },
        });
      }
    } catch (err: any) {
      console.error(`❌ Error sending auto-reply SMS:`, err);
      console.error(`❌ Error details:`, JSON.stringify(err, null, 2));
      
      await trackSmsEvent({
        messageSid: "",
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: finalFrom,
        businessId: business.id,
        status: "failed",
        errorCode: err?.code?.toString() ?? "unknown",
        errorMessage: err?.message ?? "Unknown",
        requestId: finalCallSid,
        bodyLength: 0,
        payload: { type: "missed_call_auto_reply", callSid: finalCallSid, error: err },
      });
    }
  } else {
    console.log(`⏭️ Skipping auto-reply SMS because call duration was > 10s (Duration: ${duration}s)`);
  }

  // ---------------------------------------------------------------------------
  // Success response
  // ---------------------------------------------------------------------------
  return res.status(200).json({
    success: true,
    callSid: finalCallSid,
    callStatus: finalCallStatus,
    ownerNotificationSent,
  });
}
