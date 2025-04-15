import type { NextApiRequest, NextApiResponse } from 'next';
import twilio, { validateRequest } from 'twilio';
import getRawBody from 'raw-body';

import { getBusinessByPhoneNumberSupabase, logCallEventSupabase } from '../../lib/supabase';
import { generateMissedCallResponse } from '../../lib/openai';
import { sendSms } from '../../lib/twilio';
import { trackSmsEvent, trackOwnerAlert } from '../../lib/monitoring';

export const config = {
  api: { bodyParser: false },
};

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
  // Parse x-www-form-urlencoded body
  // ---------------------------------------------------------------------------
  const rawBody = await getRawBody(req, { limit: "1mb" });
  console.log("🔍 Raw body:", rawBody.toString());
  
  const params = Object.fromEntries(
    new URLSearchParams(rawBody.toString())
  ) as Partial<TwilioWebhookParams>;

  // Hydrate req.body so any code that tries to access it directly will work
  (req as any).body = params;

  const {
    To = "",
    From = "",
    CallSid = "",
    CallStatus = "",
    ConnectDuration,
  } = params;

  console.log("📝 Parsed Twilio body:", params);
  
  // ---------------------------------------------------------------------------
  // Fallback to query params if body params are missing
  // ---------------------------------------------------------------------------
  const { To: queryTo, From: queryFrom, CallSid: queryCallSid, CallStatus: queryCallStatus, ConnectDuration: queryConnectDuration } = req.query;

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

  // Debug logs to confirm
  console.log("🧩 Final parsed To:", finalTo);
  console.log("🧩 Final parsed From:", finalFrom);
  console.log("🧩 Final parsed CallSid:", finalCallSid);
  console.log("🧩 Final parsed CallStatus:", finalCallStatus);
  console.log("🧩 Final parsed ConnectDuration:", finalConnectDuration);

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
  // Validate Twilio signature (production only)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV === "production") {
    const twilioSignature = req.headers["x-twilio-signature"] as
      | string
      | undefined;

    const webhookUrl =
      (process.env.WEBHOOK_BASE_URL?.replace(/\/$/, "") ||
        `https://${req.headers.host}`) + req.url;

    const valid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN ?? "",
      twilioSignature ?? "",
      webhookUrl,
      params
    );

    if (!valid) {
      return res.status(403).json({ error: "Invalid Twilio signature" });
    }
  }

  // ---------------------------------------------------------------------------
  // Ignore calls that were answered/connected
  // ---------------------------------------------------------------------------
  if (!MISSED_STATUSES.has(finalCallStatus)) {
    return res
      .status(200)
      .json({ success: true, message: `Status ${finalCallStatus} ignored` });
  }

  // ---------------------------------------------------------------------------
  // Business lookup
  // ---------------------------------------------------------------------------
  const business = await getBusinessByPhoneNumberSupabase(finalTo);
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }
  console.log(`✅ Business found: ${business.name} (${business.id})`);

  // ---------------------------------------------------------------------------
  // Notify owner (if we have a number)
  // ---------------------------------------------------------------------------
  const ownerPhone =
    business.customSettings?.ownerPhone ?? process.env.DEFAULT_OWNER_PHONE;
  let ownerNotificationSent = false;

  if (ownerPhone) {
    try {
      const fromNumber = process.env.TWILIO_PHONE_NUMBER!;
      const ownerMsg = await sendSms({
        body: `Missed call from ${finalFrom}. Status: ${finalCallStatus}`,
        from: fromNumber,
        to: ownerPhone,
        requestId: `${finalCallSid}-owner`,
      });
      ownerNotificationSent = true;

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
  // Auto‑reply SMS (only if call never connected)
  // ---------------------------------------------------------------------------
  const connected = Number(finalConnectDuration ?? 0) > 0;
  if (!connected) {
    try {
      const body =
        (await generateMissedCallResponse(
          business,
          business.subscription_tier ?? "basic"
        )) ||
        business.customSettings?.autoReplyMessage ||
        `Hi! Thanks for calling ${business.name}. We missed you but will ring back ASAP.`;

      const twilioNumber = process.env.TWILIO_PHONE_NUMBER!;
      const sms = await sendSms({
        body,
        from: twilioNumber,
        to: finalFrom,
        requestId: finalCallSid,
      });

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
    } catch (err: any) {
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
