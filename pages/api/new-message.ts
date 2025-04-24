import type { NextApiRequest, NextApiResponse } from 'next';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import { parse } from 'querystring';
import { getBusinessByPhoneNumberSupabase } from '../../lib/supabase';
import { generateSmsResponse, classifyMessageIntent } from '../../lib/openai';
import { sendSms } from '../../lib/twilio';
import { trackOwnerAlert } from '../../lib/monitoring';

// TypeScript interfaces for business data
interface Business {
  id: string;
  name: string;
  business_type: string;
  public_phone: string;
  twilio_phone: string;
  owner_phone?: string;  // For sending alerts
  custom_alert_keywords?: string[];  // Optional array of alert keywords
  custom_settings?: Record<string, any>;
  hours_json?: Record<string, string>;
  faqs_json?: FAQ[];
}

// Duplicate interface removed

// Disable Next.js body parser to handle raw request body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Test mock phone numbers
const TEST_MOCK_NUMBERS = {
  DISABLED_AUTO_REPLY: '+18888888888',
};

// Detect whether the request is running in test mode
const isTestMode = (req: NextApiRequest): boolean => {
  return (
    (req.body && req.body._testOverrides && Object.keys(req.body._testOverrides).length > 0) ||
    req.query.disableOpenAI === 'true' ||
    req.query.testMode === 'true' ||
    process.env.NODE_ENV === 'test'
  );
};

interface FAQ {
  question: string;
  answer: string;
}

// Helper function to check if a message matches any custom alert keywords
function matchesCustomKeywords(message: string, keywords?: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;
  
  const normalizedMessage = message.toLowerCase();
  return keywords.some(keyword => 
    normalizedMessage.includes(keyword.toLowerCase())
  );
}

// Helper function to send an alert to the business owner
async function sendOwnerAlert(
  business: Business, 
  customerMessage: string, 
  customerPhone: string, 
  detectionSource: string
): Promise<boolean> {
  try {
    if (!business.owner_phone) {
      console.log('⚠️ Cannot send owner alert: No owner_phone specified for business');
      return false;
    }
    
    const alertMessage = 
      `URGENT: New message from ${customerPhone}\n` +
      `Business: ${business.name}\n` +
      `Message: "${customerMessage}"\n` +
      `(Detected via: ${detectionSource})`;
    
    // Generate a request ID for tracking
    const requestId = Math.random().toString(36).substring(2, 10);
      
    const message = await sendSms({
      body: alertMessage,
      from: business.twilio_phone,
      to: business.owner_phone,
      requestId,
      bypassRateLimit: true
    });
    
    // Track the owner alert
    await trackOwnerAlert({
      businessId: business.id,
      ownerPhone: business.owner_phone,
      customerPhone,
      alertType: 'urgent_message',
      messageContent: customerMessage,
      detectionSource,
      messageSid: message.sid,
      delivered: true,
      errorMessage: null
    }).catch(err => {
      console.error('Error tracking owner alert:', err);
    });
    
    console.log(`✅ Owner alert sent to ${business.owner_phone} (${detectionSource})`);
    return true;
  } catch (error) {
    console.error('Error sending owner alert:', error);
    
    // Track the failed owner alert
    await trackOwnerAlert({
      businessId: business.id,
      ownerPhone: business.owner_phone || '',
      customerPhone,
      alertType: 'urgent_message',
      messageContent: customerMessage,
      detectionSource,
      messageSid: '',
      delivered: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    }).catch(err => {
      console.error('Error tracking failed owner alert:', err);
    });
    
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[handler] ---- Incoming Request ----');
  console.log('[handler] Method / Path:', req.method, req.url);
  console.log('[handler] Query params:', req.query);
  console.log('[handler] Headers:', req.headers);
  console.log('[handler] AIRTABLE_PAT set?:', Boolean(process.env.AIRTABLE_PAT));
  console.log('[handler] AIRTABLE_BASE_ID set?:', Boolean(process.env.AIRTABLE_BASE_ID));

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    console.warn('[handler] Rejecting non‑POST request:', req.method);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // ----------------------------------
    // 1. Parse & validate webhook payload
    // ----------------------------------
    // Parse the request body
    let rawBody = '';
    let body: Record<string, any> = {};
    
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      // Collect request body data
      for await (const chunk of req) {
        rawBody += chunk.toString();
      }
      
      // Validate Twilio request signature in production (unless explicitly skipped)
      const isTestEnv = process.env.NODE_ENV !== 'production' || process.env.SKIP_TWILIO_SIGNATURE === 'true';
      
      if (!isTestEnv) {
        const twilioSignature = req.headers['x-twilio-signature'] as string;
        // More robust URL construction with consistent format
        const webhookUrl = process.env.WEBHOOK_BASE_URL 
          ? `${process.env.WEBHOOK_BASE_URL.replace(/\/+$/, '')}/api/new-message` 
          : `https://${req.headers.host}/api/new-message`;
          
        // Parse the raw body for validation
        const params = parse(rawBody);
        
        // Enhanced logging for debugging
        console.log('[step 1] 🔐 Validating Twilio signature:', {
          authToken: process.env.TWILIO_AUTH_TOKEN ? 'present (redacted)' : 'missing',
          signature: twilioSignature ? 'present' : 'missing',
          webhookUrl,
          paramCount: Object.keys(params).length
        });
        
        const isValidRequest = validateRequest(
          process.env.TWILIO_AUTH_TOKEN || '',
          twilioSignature || '',
          webhookUrl,
          params
        );
        
        if (!isValidRequest) {
          console.error('[step 1] ❌ Invalid Twilio signature');
          console.error('[step 1] 🔍 Signature:', twilioSignature);
          console.error('[step 1] 🔍 Webhook URL:', webhookUrl);
          return res.status(403).json({
            error: 'Invalid signature',
            message: 'Could not validate that this request came from Twilio'
          });
        }
        
        console.log('[step 1] ✅ Twilio signature validated successfully');
      } else {
        console.log('[step 1] ⚠️ Skipping Twilio signature validation in test environment');
      }
      
      // Parse the form data
      body = parse(rawBody) as Record<string, any>;
    } else {
      body = req.body || {};
    }
    
    console.log('[step 1] 📨 Parsed Twilio webhook body:', body);
    
    const { To, From, Body: messageBody, _testOverrides = {} } = body;
    console.log('[step 1] Parsed payload:', { To, From, BodyLength: messageBody?.length, _testOverrides });

    if (!To || !From || !messageBody) {
      console.error('[step 1] Missing required Twilio fields');
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'The Twilio webhook must include To, From, and Body fields',
      });
    }

    const disableOpenAI = req.query.disableOpenAI === 'true';
    if (Object.keys(_testOverrides).length > 0 || disableOpenAI) {
      console.warn('[step 1] TEST MODE OVERRIDES detected', { _testOverrides, disableOpenAI });
    }

    // ----------------------------------
    // 2. Early‑exit for disabled numbers
    // ----------------------------------
    if (To === TEST_MOCK_NUMBERS.DISABLED_AUTO_REPLY) {
      console.info('[step 2] Auto‑reply disabled for test number', To);
      return res.status(200).json({ success: true, message: 'Auto‑reply disabled' });
    }

    // ----------------------------------
    // 3. Fetch (or mock) business record from Supabase
    // ----------------------------------
    console.time('[step 3] businessLookup');
    let business: Business;
    if (req.body.testMode === true || req.query.testMode === 'true') {
      console.info('[step 3] Using MOCK business record (testMode flag)');
      business = {
        id: 'test-business-id',
        name: 'Test Business',
        business_type: 'restaurant',
        public_phone: To,
        twilio_phone: To,
        owner_phone: '+15551234567',
        custom_alert_keywords: ['urgent', 'emergency', 'asap', 'help'],
        custom_settings: { auto_reply_enabled: true },
        faqs_json: [
          { question: 'What are your hours?', answer: "We're open 9am‑5pm Mon‑Fri." },
          { question: 'Do you deliver?', answer: 'Yes, within 5 miles.' },
        ]
      };
    } else {
      const supabaseBusiness = await getBusinessByPhoneNumberSupabase(To);

      if (!supabaseBusiness) {
        console.warn('[step 3] No business found for number', To);
        console.timeEnd('[step 3] businessLookup');
        return res.status(404).json({ error: 'Business not found' });
      }
      business = supabaseBusiness as Business;
    }
    console.timeEnd('[step 3] businessLookup');

    const businessId = business.id;
    const businessName = business.name || 'this business';
    console.log('[step 3] Using business', { businessName, businessId });

    // ----------------------------------
    // 4. Respect auto‑reply toggle
    // ----------------------------------
    if (business.custom_settings?.auto_reply_enabled === false) {
      console.info('[step 4] Auto‑reply disabled via Supabase field');
      return res.status(200).json({ success: true, message: 'Auto‑reply disabled' });
    }

    // ----------------------------------
    // 5. Parse FAQs safely
    // ----------------------------------
    console.time('[step 5] parseFaqs');
    const faqs: FAQ[] = business.faqs_json || [];
    console.timeEnd('[step 5] parseFaqs');
    console.log('[step 5] FAQ count:', faqs.length);

    // ----------------------------------
    // 6. FAQ matching helpers
    // ----------------------------------
    const normalize = (txt: string) =>
      txt.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    const matchedFaq = faqs.find((f) => normalize(messageBody).includes(normalize(f.question)));
    console.log('[step 6] matchedFaq?', Boolean(matchedFaq));

    // ----------------------------------
    // 7. Check for urgent message
    // ----------------------------------
    console.time('[step 7] urgencyCheck');
    let isUrgent = false;
    let urgencySource = '';

    // First check custom keywords (case insensitive)
    if (matchesCustomKeywords(messageBody, business.custom_alert_keywords)) {
      isUrgent = true;
      urgencySource = 'custom_keywords';
      console.log('[step 7] ⚠️ Urgent message detected via custom keywords');
    } 
    // Then check using GPT intent classification
    else if (process.env.ENABLE_OPENAI_FALLBACK !== 'false' && !disableOpenAI) {
      try {
        const isUrgentByGPT = await classifyMessageIntent(messageBody, business.business_type);
        if (isUrgentByGPT) {
          isUrgent = true;
          urgencySource = 'gpt_classification';
          console.log('[step 7] ⚠️ Urgent message detected via GPT classification');
        }
      } catch (err) {
        console.error('[step 7] Error during GPT urgency classification:', err);
      }
    }

    // Send owner alert if message is urgent
    if (isUrgent && business.owner_phone) {
      console.log('[step 7] 📱 Sending owner alert...');
      await sendOwnerAlert(business, messageBody, From, urgencySource);
    }
    console.timeEnd('[step 7] urgencyCheck');

    // ----------------------------------
    // 8. Build the response text
    // ----------------------------------
    const businessType = business.business_type || 'local';
    const additionalInfo = {
      hours: business.hours_json ? JSON.stringify(business.hours_json) : null,
      location: business.custom_settings?.location,
      website: business.custom_settings?.website,
      orderingLink: business.custom_settings?.ordering_link,
    };

    let responseMessage = '';
    let responseSource: string = 'default';

    if (matchedFaq) {
      responseMessage = matchedFaq.answer;
      responseSource = 'faq';
      console.log('[step 8] Responding with FAQ answer');
    } else {
      const openAiEnabled = process.env.ENABLE_OPENAI_FALLBACK !== 'false' && !disableOpenAI;
      console.log('[step 8] openAiEnabled?', openAiEnabled);
      if (openAiEnabled) {
        console.time('[step 8] openAI');
        try {
          responseMessage = (await Promise.race([
            generateSmsResponse(messageBody, faqs, businessName, businessType, additionalInfo),
            new Promise<string>((_, reject) => setTimeout(() => reject('timeout'), 5000)),
          ])) ?? '';
          responseSource = 'openai';
          console.timeEnd('[step 8] openAI');
        } catch (err) {
          console.error('[step 8] OpenAI error or timeout:', err);
          console.timeEnd('[step 8] openAI');
        }
      }

      if (!responseMessage) {
        const customFallback = business.custom_settings?.fallback_message;
        if (customFallback) {
          responseMessage = customFallback;
          responseSource = 'custom_fallback';
          console.log('[step 8] Using custom fallback message');
        } else {
          responseMessage =
            "Sorry, we couldn't understand your question. Please call us directly.";
          responseSource = 'default_fallback';
          console.log('[step 8] Using default fallback message');
        }
      }
    }

    // ----------------------------------
    // 9. Send SMS (mock if test mode)
    // ----------------------------------
    const requestId = Math.random().toString(36).substring(2, 10);
    const start = Date.now();
    let messageSid = '';

    console.log('[step 9] Prepared response', { responseSource, responseMessage });

    if (isTestMode(req) && (/^\+1619/.test(From) || From === '+16193721633')) {
      messageSid = `mock-${requestId}`;
      console.info(`[step 9][${requestId}] Mock SMS (test mode) sent to`, From);
    } else {
      try {
        const message = await sendSms({ body: responseMessage, from: To, to: From, requestId });
        messageSid = message.sid;
        console.info(`[step 9][${requestId}] Twilio SMS sent, SID:`, messageSid);
      } catch (twilioErr: any) {
        console.error(`[step 9][${requestId}] Twilio error:`, twilioErr.message);
        if (isTestMode(req)) {
          messageSid = `mock-error-${requestId}`;
        } else {
          return res.status(200).json({
            success: false,
            requestId,
            businessId,
            businessName,
            matchedFaq: matchedFaq?.question ?? null,
            responseMessage,
            responseSource,
            error: `Failed to send SMS: ${twilioErr.message}`,
          });
        }
      }
    }

    const processingTime = Date.now() - start;
    console.log('[step 9] Processing time ms:', processingTime);

    // ----------------------------------
    // 10. Success response
    // ----------------------------------
    console.log('[step 10] Returning success JSON');
    return res.status(200).json({
      success: true,
      requestId,
      businessId,
      businessName,
      matchedFaq: matchedFaq?.question ?? null,
      responseMessage,
      responseSource,
      processingTime,
      messageSid,
    });
  } catch (err: any) {
    console.error('[handler] UNHANDLED ERROR:', err);
    const msg = err.message ?? 'Server error';

    if (/invalid api key/i.test(msg)) return res.status(401).json({ error: msg });
    if (/not found/i.test(msg)) return res.status(404).json({ error: msg });
    if (/permission/i.test(msg)) return res.status(403).json({ error: msg });
    if (/rate limit/i.test(msg)) return res.status(429).json({ error: msg });

    return res.status(500).json({ error: msg });
  }
}
