import type { NextApiRequest, NextApiResponse } from 'next';
import { getTable } from '../../lib/data/airtable-client';
import { generateSmsResponse } from '../../lib/openai';
import { sendSms } from '../../lib/twilio';

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

// Minimal interface for an Airtable record used in this handler
interface BusinessRecord {
  id: string;
  get: (field: string) => any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[handler] ---- Incoming Request ----');
  console.log('[handler] Method / Path:', req.method, req.url);
  console.log('[handler] Query params:', req.query);
  console.log('[handler] Body keys:', Object.keys(req.body || {}));
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
    const { To, From, Body, _testOverrides = {} } = req.body ?? {};
    console.log('[step 1] Parsed payload:', { To, From, BodyLength: Body?.length, _testOverrides });

    if (!To || !From || !Body) {
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
    // 3. Fetch (or mock) business record
    // ----------------------------------
    console.time('[step 3] businessLookup');
    let business: BusinessRecord;
    if (req.body.testMode === true || req.query.testMode === 'true') {
      console.info('[step 3] Using MOCK business record (testMode flag)');
      business = {
        id: 'test-business-id',
        get: (field: string) => {
          switch (field) {
            case 'Business Name':
              return 'Test Business';
            case 'Business Type':
              return 'restaurant';
            case 'Auto-Reply Enabled':
              return true;
            case 'FAQs':
              return JSON.stringify([
                { question: 'What are your hours?', answer: "We're open 9am‑5pm Mon‑Fri." },
                { question: 'Do you deliver?', answer: 'Yes, within 5 miles.' },
              ]);
            default:
              return null;
          }
        },
      };
    } else {
      const table = getTable('Businesses');
      const records = await table
        .select({ filterByFormula: `{Phone Number} = "${To}"`, maxRecords: 1 })
        .firstPage();

      if (records.length === 0) {
        console.warn('[step 3] No business found for number', To);
        console.timeEnd('[step 3] businessLookup');
        return res.status(404).json({ error: 'Business not found' });
      }
      business = records[0] as BusinessRecord;
    }
    console.timeEnd('[step 3] businessLookup');

    const businessId = business.id;
    const businessName = (business.get('Business Name') as string) || 'this business';
    console.log('[step 3] Using business', { businessName, businessId });

    // ----------------------------------
    // 4. Respect auto‑reply toggle
    // ----------------------------------
    if (business.get('Auto-Reply Enabled') === false) {
      console.info('[step 4] Auto‑reply disabled via Airtable field');
      return res.status(200).json({ success: true, message: 'Auto‑reply disabled' });
    }

    // ----------------------------------
    // 5. Parse FAQs safely
    // ----------------------------------
    console.time('[step 5] parseFaqs');
    const parseFaqs = (): FAQ[] => {
      const faqsField = _testOverrides.malformedFaqs ? '{malformed json}' : business.get('FAQs');
      try {
        if (!faqsField) return [];
        if (Array.isArray(faqsField)) return faqsField as FAQ[];
        const parsed = JSON.parse(faqsField);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error('[step 5] FAQ JSON parse error:', err);
        return [];
      }
    };

    const faqs = parseFaqs();
    console.timeEnd('[step 5] parseFaqs');
    console.log('[step 5] FAQ count:', faqs.length);

    // ----------------------------------
    // 6. FAQ matching helpers
    // ----------------------------------
    const normalize = (txt: string) =>
      txt.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    const matchedFaq = faqs.find((f) => normalize(Body).includes(normalize(f.question)));
    console.log('[step 6] matchedFaq?', Boolean(matchedFaq));

    // ----------------------------------
    // 7. Build the response text
    // ----------------------------------
    const businessType = business.get('Business Type') || 'local';
    const additionalInfo = {
      hours: business.get('Business Hours'),
      location: business.get('Location'),
      website: business.get('Website'),
      orderingLink: business.get('Online Ordering Link'),
    };

    let responseMessage = '';
    let responseSource: string = 'default';

    if (matchedFaq) {
      responseMessage = matchedFaq.answer;
      responseSource = 'faq';
      console.log('[step 7] Responding with FAQ answer');
    } else {
      const openAiEnabled = process.env.ENABLE_OPENAI_FALLBACK !== 'false' && !disableOpenAI;
      console.log('[step 7] openAiEnabled?', openAiEnabled);
      if (openAiEnabled) {
        console.time('[step 7] openAI');
        try {
          responseMessage = (await Promise.race([
            generateSmsResponse(Body, faqs, businessName, businessType, additionalInfo),
            new Promise<string>((_, reject) => setTimeout(() => reject('timeout'), 5000)),
          ])) ?? '';
          responseSource = 'openai';
          console.timeEnd('[step 7] openAI');
        } catch (err) {
          console.error('[step 7] OpenAI error or timeout:', err);
          console.timeEnd('[step 7] openAI');
        }
      }

      if (!responseMessage) {
        const customFallback = business.get('Custom Fallback Message');
        if (customFallback) {
          responseMessage = customFallback;
          responseSource = 'custom_fallback';
          console.log('[step 7] Using custom fallback message');
        } else {
          responseMessage =
            "Sorry, we couldn't understand your question. Please call us directly.";
          responseSource = 'default_fallback';
          console.log('[step 7] Using default fallback message');
        }
      }
    }

    // ----------------------------------
    // 8. Send SMS (mock if test mode)
    // ----------------------------------
    const requestId = Math.random().toString(36).substring(2, 10);
    const start = Date.now();
    let messageSid = '';

    console.log('[step 8] Prepared response', { responseSource, responseMessage });

    if (isTestMode(req) && (/^\+1619/.test(From) || From === '+16193721633')) {
      messageSid = `mock-${requestId}`;
      console.info(`[step 8][${requestId}] Mock SMS (test mode) sent to`, From);
    } else {
      try {
        const message = await sendSms({ body: responseMessage, from: To, to: From, requestId });
        messageSid = message.sid;
        console.info(`[step 8][${requestId}] Twilio SMS sent, SID:`, messageSid);
      } catch (twilioErr: any) {
        console.error(`[step 8][${requestId}] Twilio error:`, twilioErr.message);
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
    console.log('[step 8] Processing time ms:', processingTime);

    // ----------------------------------
    // 9. Success response
    // ----------------------------------
    console.log('[step 9] Returning success JSON');
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
