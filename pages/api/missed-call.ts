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
  // Parse x-www-form-urlencoded body
  // ---------------------------------------------------------------------------
  const rawBody = await getRawBody(req, { limit: "1mb" });
  const params = Object.fromEntries(
    new URLSearchParams(rawBody.toString())
  ) as Partial<TwilioWebhookParams>;

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

  const finalTo = To || (queryTo as string) || "";
  const finalFrom = From || (queryFrom as string) || "";
  const finalCallSid = CallSid || (queryCallSid as string) || "";
  const finalCallStatus = CallStatus || (queryCallStatus as string) || "";
  const finalConnectDuration = ConnectDuration || (queryConnectDuration as string);

  // Debug logs to confirm
  console.log("🧩 Final parsed To:", finalTo);
  console.log("🧩 Final parsed From:", finalFrom);
  console.log("🧩 Final parsed CallSid:", finalCallSid);
  console.log("🧩 Final parsed CallStatus:", finalCallStatus);
  console.log("🧩 Final parsed ConnectDuration:", finalConnectDuration);

  // ---------------------------------------------------------------------------
  // Validate required fields
  // ---------------------------------------------------------------------------
  if (!finalTo || !finalFrom || !finalCallStatus) {
    return res
      .status(400)
      .json({ error: "Missing required fields: To, From, CallStatus" });
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
