import type { NextApiRequest, NextApiResponse } from 'next';
import { validateRequest } from 'twilio/lib/webhooks/webhooks';
import { parse } from 'querystring';
import { getBusinessByPhoneNumberSupabase } from '../../lib/supabase';
import { generateSmsResponse, classifyMessageIntent } from '../../lib/openai';
import { sendSms } from '../../lib/twilio';
import { trackOwnerAlert } from '../../lib/monitoring';
import { sendUrgentOwnerAlert } from '../../lib/notifications';

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
  online_ordering_url?: string;  // URL for online ordering (optional)
}

// TypeScript interface for normalized business settings
interface NormalizedSettings {
  twilioNumber: string;
  ownerPhone: string | undefined;
  autoReplyOptions: string[];
}

// Utility functions for business settings

/**
 * Normalizes business settings with appropriate fallbacks
 * @param business The business record from Supabase
 * @param debug Whether to log detailed debugging information
 * @returns Normalized settings object
 */
function normalizeBusinessSettings(
  business: Business, 
  debug: boolean = false
): NormalizedSettings {
  const settings = business.custom_settings || {};
  const businessType = business.business_type || 'unknown';
  
  // Define default options by business type
  const defaultOptionsByType: Record<string, string[]> = {
    restaurant: ["hours & address", "menu details", "online ordering link"],
    autoshop: ["hours & address", "service quotes", "schedule an appointment"],
    retail: ["hours & address", "product availability", "current promotions"],
    salon: ["hours & address", "service list", "schedule an appointment"],
    medical: ["hours & address", "appointment scheduling", "insurance questions"],
    // Add more types as needed
  };
  
  // Extract twilioNumber with fallback
  const twilioNumber = settings.twilioNumber || business.twilio_phone;
  if (debug && !settings.twilioNumber) {
    console.log(`[settings] ℹ️ Using fallback twilio_phone: ${twilioNumber}`);
  }
  
  // Extract ownerPhone with fallback
  const ownerPhone = settings.ownerPhone || business.owner_phone;
  if (debug && !settings.ownerPhone && business.owner_phone) {
    console.log(`[settings] ℹ️ Using fallback owner_phone: ${ownerPhone}`);
  }
  
  // Determine auto reply options with fallbacks
  let autoReplyOptions: string[];
  let optionsSource: string;
  
  if (settings.autoReplyOptions) {
    autoReplyOptions = settings.autoReplyOptions;
    optionsSource = 'custom_settings';
  } else if (businessType !== 'unknown' && defaultOptionsByType[businessType]) {
    autoReplyOptions = defaultOptionsByType[businessType];
    optionsSource = `default_for_${businessType}`;
  } else {
    autoReplyOptions = ["hours & address", "online ordering link"];
    optionsSource = 'generic_default';
  }
  
  if (debug) {
    console.log(`[settings] ℹ️ Using ${optionsSource} for autoReplyOptions`);
  }
  
  return {
    twilioNumber,
    ownerPhone,
    autoReplyOptions
  };
}

/**
 * Creates a friendly list from array items (e.g., "a, b, or c")
 * @param items Array of strings to format
 * @returns Formatted string
 */
function makeFriendlyList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1).join(", ");
  return `${otherItems}, or ${lastItem}`;
}

/**
 * Formats settings for structured logging
 * @param settings The normalized settings object
 * @returns Object suitable for logging
 */
function formatSettingsForLog(settings: NormalizedSettings): Record<string, any> {
  return {
    twilioNumber: settings.twilioNumber,
    ownerPhone: settings.ownerPhone || '(none)',
    autoReplyOptionsCount: settings.autoReplyOptions.length,
    autoReplyOptionsPreview: settings.autoReplyOptions.join(', ').substring(0, 50) + 
      (settings.autoReplyOptions.join(', ').length > 50 ? '...' : '')
  };
}

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
const isTestMode = (req: NextApiRequest, body: Record<string, any>): boolean => {
  const testOverrides = body?._testOverrides ?? {};
  return (
    Object.keys(testOverrides).length > 0 ||
    req.query.disableOpenAI === 'true' ||
    req.query.testMode === 'true' ||
    process.env.NODE_ENV === 'test'
  );
};

interface FAQ {
  question: string;
  answer: string;
}

// Define standard urgency keywords that apply to all businesses
const STANDARD_URGENCY_KEYWORDS = [
  "urgent",
  "emergency", 
  "need help",
  "need a quote",
  "request service",
  "broken",
  "leaking",
  "no power",
  "no AC"
];

// Helper function to check if a message contains standard urgency keywords
function detectStandardUrgency(message: string): string | null {
  const normalizedMessage = message.toLowerCase();
  
  // Use .find() array method to get the matched keyword
  const matchedKeyword = STANDARD_URGENCY_KEYWORDS.find(keyword => 
    normalizedMessage.includes(keyword.toLowerCase())
  );
  
  return matchedKeyword || null;
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
  detectionSource: string,
  normalizedSettings?: NormalizedSettings
): Promise<boolean> {
  // Use normalized settings if provided, otherwise fall back to business record
  const ownerPhone = normalizedSettings?.ownerPhone || business.owner_phone;
  const twilioNumber = normalizedSettings?.twilioNumber || business.twilio_phone;
  
  if (!ownerPhone) {
    console.log('⚠️ Cannot send owner alert: No owner phone available');
    return false;
  }
  
  try {
    const alertMessage = 
      `Customer is requesting attention: ${customerPhone}\n` +
      `Business: ${business.name}\n` +
      `Message: "${customerMessage}"\n` +
      `(Detected via: ${detectionSource})`;
    
    // Generate a request ID for tracking
    const requestId = Math.random().toString(36).substring(2, 10);
      
    const message = await sendSms({
      body: alertMessage,
      from: twilioNumber,
      to: ownerPhone,
      requestId,
      bypassRateLimit: true
    });
    
    // Track the owner alert
    await trackOwnerAlert({
      businessId: business.id,
      ownerPhone,
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
    
    console.log(`✅ Owner alert sent to ${ownerPhone} (${detectionSource})`);
    return true;
  } catch (error) {
    console.error('Error sending owner alert:', error);
    
    // Track the failed owner alert
    await trackOwnerAlert({
      businessId: business.id,
      ownerPhone: ownerPhone || '',
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
  
  // Enable debug mode based on environment or query params
  const enableDebug = 
    process.env.DEBUG_SETTINGS === 'true' || 
    req.query.debugSettings === 'true' ||
    isTestMode(req, {});

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
    
    // Extract fields from the body
    const To = body.To;
    const From = body.From;
    const messageBody = body.Body;
    
    // Parse _testOverrides if it's a string (from form-encoded data)
    let _testOverrides = body._testOverrides || {};
    if (typeof _testOverrides === 'string') {
      try {
        _testOverrides = JSON.parse(_testOverrides);
      } catch (err) {
        console.error('[step 1] Error parsing _testOverrides JSON string:', err);
        _testOverrides = {};
      }
    }
    
    console.log(`[new-message] Incoming SMS: From=${From || 'MISSING'}, To=${To || 'MISSING'}, Body="${messageBody || 'MISSING'}"`);
    console.log('[step 1] Parsed payload:', { To, From, BodyLength: messageBody?.length, _testOverrides });

    // Check for required fields with specific error reporting
    const missingFields: string[] = [];
    if (!To) missingFields.push('To');
    if (!From) missingFields.push('From');
    if (!messageBody) missingFields.push('Body');

    if (missingFields.length > 0) {
      console.error(`[step 1] Missing required Twilio fields: ${missingFields.join(', ')}`);
      return res.status(400).json({
        error: 'Missing required fields',
        message: `The Twilio webhook is missing required fields: ${missingFields.join(', ')}`,
        missingFields
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
    if (body.testMode === true || body.testMode === 'true' || req.query.testMode === 'true') {
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
      
      // Apply test overrides if provided
      if (_testOverrides) {
        // If a complete business object is provided in _testOverrides, use it
        if (_testOverrides.business) {
          console.log('[step 3] Using business from _testOverrides');
          business = _testOverrides.business;
        } else {
          // Apply business type override
          if (_testOverrides.businessType) {
            business.business_type = _testOverrides.businessType;
          }
          
          // Apply online ordering URL override
          if (_testOverrides.online_ordering_url) {
            business.online_ordering_url = _testOverrides.online_ordering_url;
            console.log('[step 3] Applied online_ordering_url override:', business.online_ordering_url);
          }
        }
      }
      
      // Log the business object for debugging
      console.log('[step 3] Business object after applying overrides:', JSON.stringify(business, null, 2));
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
    // 3.5. Normalize business settings
    // ----------------------------------
    console.time('[step 3.5] normalizeSettings');
    
    // Use our extracted function with debug flag
    const normalizedSettings = normalizeBusinessSettings(business, enableDebug);
    const { twilioNumber, ownerPhone, autoReplyOptions } = normalizedSettings;
    
    console.log('[step 3.5] Normalized settings:', formatSettingsForLog(normalizedSettings));
    console.timeEnd('[step 3.5] normalizeSettings');

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
    // 6. Check for online ordering request
    // ----------------------------------
    console.time('[step 6] onlineOrderingCheck');
    let isOnlineOrderingRequest = false;
    let responseMessage = '';
    let responseSource: string = 'default';
    let matchedFaq: FAQ | undefined;
    
    // Check if business has online ordering URL and message contains ordering keywords
    const matchResult = messageBody.toLowerCase().match(/order|ordering|place an order/);
    const containsOrderingKeywords = matchResult !== null;
    
    console.log('[step 6] DEBUG: Online ordering check');
    console.log('[step 6] DEBUG: messageBody:', messageBody);
    console.log('[step 6] DEBUG: business.online_ordering_url:', business.online_ordering_url);
    console.log('[step 6] DEBUG: matchResult:', matchResult);
    console.log('[step 6] DEBUG: containsOrderingKeywords:', containsOrderingKeywords);
    
    // Convert to boolean to ensure we get true/false (not null/undefined)
    isOnlineOrderingRequest = Boolean(business.online_ordering_url && containsOrderingKeywords);
    
    if (isOnlineOrderingRequest) {
      console.log('[step 6] ✅ Online ordering request detected');
      console.log(`[step 6] Matched keyword: "${matchResult ? matchResult[0] : 'none'}"`);
      
      // Skip FAQ matching and OpenAI processing
      responseMessage = `You can place your order here: ${business.online_ordering_url}`;
      responseSource = 'online_ordering_direct';
      console.log('[step 6] Responding with online ordering URL');
      console.log('[step 6] DEBUG: responseMessage:', responseMessage);
      console.log('[step 6] DEBUG: responseSource:', responseSource);
      console.log('[step 6] DEBUG: isOnlineOrderingRequest:', isOnlineOrderingRequest);
    } else {
      console.log('[step 6] ❌ Not an online ordering request');
      console.log('[step 6] DEBUG: Condition failed:', business.online_ordering_url ? 'Has URL' : 'No URL', containsOrderingKeywords ? 'Has keywords' : 'No keywords');
    }
    console.timeEnd('[step 6] onlineOrderingCheck');
    
    // ----------------------------------
    // 7. FAQ matching helpers (if not online ordering)
    // ----------------------------------
    if (!isOnlineOrderingRequest) {
      const normalize = (txt: string) =>
        txt.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

      matchedFaq = faqs.find((f) => normalize(messageBody).includes(normalize(f.question)));
      console.log('[step 7] matchedFaq?', Boolean(matchedFaq));
    }

    // ----------------------------------
    // 8. Check for urgent message (if not online ordering)
    // ----------------------------------
    console.time('[step 8] urgencyCheck');
    let isUrgent = false;
    let urgencySource = '';
    let matchedUrgentKeyword = '';

    if (!isOnlineOrderingRequest) {
      // First check standard urgency keywords
      const urgentKeyword = detectStandardUrgency(messageBody);
      if (urgentKeyword) {
        isUrgent = true;
        urgencySource = 'standard_keywords';
        matchedUrgentKeyword = urgentKeyword;
        console.log(`[urgency detection] Keyword matched: "${urgentKeyword}"`);
        console.log('[step 8] ⚠️ Urgent message detected via standard keywords');
      }
      // Then check custom keywords (case insensitive)
      else if (matchesCustomKeywords(messageBody, business.custom_alert_keywords)) {
        isUrgent = true;
        urgencySource = 'custom_keywords';
        console.log('[step 8] ⚠️ Urgent message detected via custom keywords');
      } 
      // Then check using GPT intent classification
      else if (process.env.ENABLE_OPENAI_FALLBACK !== 'false' && !disableOpenAI) {
        try {
          const isUrgentByGPT = await classifyMessageIntent(messageBody, business.business_type);
          if (isUrgentByGPT) {
            isUrgent = true;
            urgencySource = 'gpt_classification';
            console.log('[step 8] ⚠️ Urgent message detected via GPT classification');
          }
        } catch (err) {
          console.error('[step 8] Error during GPT urgency classification:', err);
        }
      }
    }

    // Send owner alert if message is urgent
    if (isUrgent) {
      if (ownerPhone) {
        console.log('[step 8] 📱 Sending owner alert...');
        await sendUrgentOwnerAlert(
          ownerPhone,
          business.name, 
          business.id,
          messageBody, 
          From, 
          twilioNumber,  // Use normalized twilioNumber
          urgencySource
        );
      } else {
        console.warn('[step 8] ⚠️ Cannot send owner alert: No owner phone found in normalized settings');
      }
    }
    console.timeEnd('[step 8] urgencyCheck');

    // ----------------------------------
    // 9. Build the response text (if not online ordering)
    // ----------------------------------
    if (!isOnlineOrderingRequest) {
      const businessType = business.business_type || 'local';
      const additionalInfo = {
        hours: business.hours_json ? JSON.stringify(business.hours_json) : null,
        location: business.custom_settings?.location,
        website: business.custom_settings?.website,
        orderingLink: business.custom_settings?.ordering_link,
        online_ordering_url: business.online_ordering_url,
      };

      // Create a friendly list of auto-reply options
      const optionsText = makeFriendlyList(autoReplyOptions);
      
      // Construct dynamic system prompt based on business type and available information
      let systemPrompt = `You are replying to a customer on behalf of ${businessName}, which is a ${businessType}. Respond politely and helpfully in a friendly, conversational tone.`;

      // Add business-type specific instructions
      if (businessType.toLowerCase() === 'restaurant') {
        if (business.online_ordering_url) {
          systemPrompt += ` If they ask about ordering food, placing an order, menu options, or takeout, suggest our online ordering site here: ${business.online_ordering_url}.`;
        }
      } else if (['autoshop', 'auto shop', 'plumber', 'electrician', 'mechanic', 'contractor'].includes(businessType.toLowerCase())) {
        systemPrompt += ` If they mention needing a quote, estimate, scheduling service, or urgent help, offer to gather details and connect them with the owner for a personalized response.`;
      } else {
        systemPrompt += ` Answer their questions appropriately for our type of business.`;
      }
      
      // Add common options to the prompt
      systemPrompt += ` Common questions we can help with include: ${optionsText}.`;
      
      // Add urgency acknowledgment if message is urgent
      if (isUrgent) {
        systemPrompt += ` The customer's message appears urgent. Acknowledge the urgency and let them know their request will be prioritized.`;
      }

      // Add general instructions
      systemPrompt += ` Keep responses brief, helpful and conversational. Do not make up information you don't have.`;

      // Log the final system prompt for debugging
      console.log('[step 9] Final OpenAI system prompt:', systemPrompt);

      if (matchedFaq) {
        responseMessage = matchedFaq.answer;
        responseSource = 'faq';
        console.log('[step 9] Responding with FAQ answer');
      } else {
        const openAiEnabled = process.env.ENABLE_OPENAI_FALLBACK !== 'false' && !disableOpenAI;
        console.log('[step 9] openAiEnabled?', openAiEnabled);
        if (openAiEnabled) {
          console.time('[step 9] openAI');
          try {
            // Pass the system prompt to OpenAI
            responseMessage = (await Promise.race([
              generateSmsResponse(messageBody, faqs, businessName, businessType, additionalInfo, systemPrompt),
              new Promise<string>((_, reject) => setTimeout(() => reject('timeout'), 5000)),
            ])) ?? '';
            responseSource = 'openai';
            console.timeEnd('[step 9] openAI');
          } catch (err) {
            console.error('[step 9] OpenAI error or timeout:', err);
            console.timeEnd('[step 9] openAI');
          }
        }

        if (!responseMessage) {
          const customFallback = business.custom_settings?.fallback_message;
          if (customFallback) {
            responseMessage = customFallback;
            responseSource = 'custom_fallback';
            console.log('[step 9] Using custom fallback message');
          } else {
            responseMessage =
              "Sorry, we couldn't understand your question. Please call us directly.";
            responseSource = 'default_fallback';
            console.log('[step 9] Using default fallback message');
          }
        }
      }
    }

    // ----------------------------------
    // 10. Send SMS (mock if test mode)
    // ----------------------------------
    const requestId = Math.random().toString(36).substring(2, 10);
    const start = Date.now();
    let messageSid = '';

    console.log('[step 10] Prepared response', { responseSource, responseMessage });

    if (isTestMode(req, body) && (/^\+1619/.test(From) || From === '+16193721633')) {
      messageSid = `mock-${requestId}`;
      console.info(`[step 10][${requestId}] Mock SMS (test mode) sent to`, From);
    } else {
      try {
        const message = await sendSms({ 
          body: responseMessage, 
          from: twilioNumber,  // Use normalized twilioNumber
          to: From, 
          requestId 
        });
        messageSid = message.sid;
        console.info(`[step 10][${requestId}] Twilio SMS sent, SID:`, messageSid);
      } catch (twilioErr: any) {
        console.error(`[step 10][${requestId}] Twilio error:`, twilioErr.message);
        if (isTestMode(req, body)) {
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
    console.log('[step 10] Processing time ms:', processingTime);

    // ----------------------------------
    // 11. Success response
    // ----------------------------------
    console.log('[step 11] Returning success JSON');
    return res.status(200).json({
      success: true,
      requestId,
      businessId,
      businessName,
      matchedFaq: isOnlineOrderingRequest ? null : (matchedFaq?.question ?? null),
      responseMessage,
      responseSource,
      processingTime,
      messageSid,
      urgentFlag: isUrgent ? true : undefined,
      urgencySource: isUrgent ? urgencySource : undefined,
      urgentKeyword: matchedUrgentKeyword || undefined,
      onlineOrderingRequest: isOnlineOrderingRequest ? true : undefined
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
