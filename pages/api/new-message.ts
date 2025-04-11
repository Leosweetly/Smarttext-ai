import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';
import { getTable } from '../../lib/data/airtable-client';
import { generateSmsResponse } from '../../lib/openai';

// Test mock phone numbers
const TEST_MOCK_NUMBERS = {
  DISABLED_AUTO_REPLY: '+18888888888'
};

// Test mode detection
const isTestMode = (req: NextApiRequest): boolean => {
  return (
    // Check for test overrides in the request body
    (req.body && req.body._testOverrides && Object.keys(req.body._testOverrides).length > 0) ||
    // Check for test query parameters
    req.query.disableOpenAI === 'true' ||
    req.query.testMode === 'true' ||
    // Check for test environment variable
    process.env.NODE_ENV === 'test'
  );
};

interface FAQ {
  question: string;
  answer: string;
}

// Mock business interface to match Airtable record structure
interface BusinessRecord {
  id: string;
  get: (field: string) => any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract data from Twilio webhook
    const { To, From, Body, _testOverrides = {} } = req.body;
    
    // Check for test query parameters
    const disableOpenAI = req.query.disableOpenAI === 'true';
    
    // Log test mode if active
    if (Object.keys(_testOverrides).length > 0 || disableOpenAI) {
      console.log(`[new-message] Running in TEST MODE with overrides:`, 
        JSON.stringify({ _testOverrides, disableOpenAI }));
    }

    if (!To || !From || !Body) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'The Twilio webhook must include To, From, and Body fields'
      });
    }

    console.log(`[new-message] Received message from ${From} to ${To}: "${Body}"`);

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Handle test mock phone numbers
    if (To === TEST_MOCK_NUMBERS.DISABLED_AUTO_REPLY) {
      console.log(`[new-message] TEST MODE: Using disabled auto-reply business for ${To}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Auto-reply is disabled for this business' 
      });
    }

    // Initialize business variables
    let business: BusinessRecord;
    let businessId: string;
    let businessName: string;

    // Check if we're in test mode with testMode flag
    if (req.body.testMode === true || req.query.testMode === 'true') {
      console.log(`[new-message] TEST MODE: Bypassing business lookup for ${To}`);
      
      // Create a mock business record for testing
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
                { question: "What are your hours?", answer: "We're open 9am-5pm Monday to Friday." },
                { question: "Do you deliver?", answer: "Yes, we offer delivery within 5 miles." }
              ]);
            default:
              return null;
          }
        }
      };
      
      businessId = business.id;
      businessName = business.get('Business Name') as string;
      
      console.log(`[new-message] Using mock business: ${businessName} (${businessId})`);
    } else {
      // Look up the business by phone number
      const table = getTable('Businesses');
      const records = await table.select({
        filterByFormula: `{Phone Number} = "${To}"`,
        maxRecords: 1
      }).firstPage();

      // If no business found, log and return
      if (records.length === 0) {
        console.log(`[new-message] No business found with phone number ${To}`);
        return res.status(404).json({ error: 'Business not found' });
      }
      
      // Use the real business from Airtable
      business = records[0];
      businessId = business.id;
      businessName = business.get('Business Name') as string || 'this business';
      
      console.log(`[new-message] Found business: ${businessName} (${businessId})`);
    }

    // Check if auto-reply is enabled (if the field exists)
    const autoReplyEnabled = business.get('Auto-Reply Enabled');
    if (autoReplyEnabled === false) {
      console.log(`[new-message] Auto-reply is disabled for business ${businessId}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Auto-reply is disabled for this business' 
      });
    }

    // Parse FAQs from the business record
    let faqs: FAQ[] = [];
    let faqParsingError = false;
    
    // Test override for malformed FAQs
    if (_testOverrides.malformedFaqs) {
      console.log(`[new-message] TEST MODE: Simulating malformed FAQs`);
      try {
        // This will intentionally throw an error
        faqs = JSON.parse('{malformed json}');
      } catch (error) {
        console.error(`[new-message] Error parsing FAQs (test mode):`, error);
        faqParsingError = true;
      }
    } else {
      const faqsField = business.get('FAQs');
      
      // Debug log the raw FAQ data
      console.log(`[new-message] Raw FAQs data type: ${typeof faqsField}`);
      if (faqsField) {
        try {
          console.log(`[new-message] Raw FAQs data: ${typeof faqsField === 'string' ? faqsField : JSON.stringify(faqsField)}`);
          
          // If FAQs is a string, parse it as JSON
          if (typeof faqsField === 'string') {
            try {
              faqs = JSON.parse(faqsField);
              // Validate the parsed data is an array
              if (!Array.isArray(faqs)) {
                console.error(`[new-message] Parsed FAQs is not an array for business ${businessId}`);
                faqs = [];
                faqParsingError = true;
              }
            } catch (error) {
              console.error(`[new-message] Error parsing FAQs for business ${businessId}:`, error);
              faqParsingError = true;
              // Safe fallback - empty array
              faqs = [];
            }
          } 
          // If FAQs is already an array, use it directly
          else if (Array.isArray(faqsField)) {
            faqs = faqsField as FAQ[];
          }
          // Handle other types gracefully
          else {
            console.error(`[new-message] Unexpected FAQs data type for business ${businessId}: ${typeof faqsField}`);
            faqParsingError = true;
            faqs = [];
          }
        } catch (error) {
          console.error(`[new-message] Error processing FAQs for business ${businessId}:`, error);
          faqParsingError = true;
          faqs = [];
        }
      }
    }

    // Log the parsed FAQs for debugging
    console.log(`[new-message] Found ${faqs.length} FAQs for business ${businessId}`);
    if (faqs.length > 0) {
      console.log(`[new-message] FAQ questions: ${faqs.map(faq => `"${faq.question}"`).join(', ')}`);
    }
    if (faqParsingError) {
      console.log(`[new-message] Using empty FAQs array due to parsing error`);
    }

    // Normalize text helper to ignore casing, punctuation, and extra spaces
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/gi, '') // Remove punctuation
        .replace(/\s+/g, ' ')    // Collapse multiple spaces
        .trim();
    };

    const normalizedMessage = normalizeText(Body);
    // Debug logs to inspect normalized message and FAQ questions
    console.log('Normalized incoming message:', normalizedMessage);
    faqs.forEach(faq => {
      console.log('FAQ question raw:', faq.question);
      console.log('FAQ question normalized:', normalizeText(faq.question));
    });
    const matchedFaq = faqs.find(faq =>
      normalizedMessage.includes(normalizeText(faq.question))
    );

    // Extract additional business info for OpenAI context
    const businessType = business.get('Business Type') || 'local';
    const additionalInfo = {
      hours: business.get('Business Hours'),
      location: business.get('Location'),
      website: business.get('Website'),
      orderingLink: business.get('Online Ordering Link')
    };

    // Prepare the response message
    let responseMessage: string;
    let responseSource: string = 'unknown';
    
    if (matchedFaq) {
      console.log(`[new-message] Matched FAQ: "${matchedFaq.question}"`);
      responseMessage = matchedFaq.answer;
      responseSource = "faq";
    } else {
      console.log(`[new-message] No matching FAQ found for message: "${Body}"`);
      
      // Check if OpenAI fallback is enabled (could be in environment variables, query params, or database)
      const openAiFallbackEnabled = process.env.ENABLE_OPENAI_FALLBACK !== 'false' && !disableOpenAI;
      
      if (disableOpenAI) {
        console.log(`[new-message] TEST MODE: OpenAI fallback disabled via query parameter`);
      }
      
      if (openAiFallbackEnabled) {
        // Try OpenAI fallback with timeout
        let openAIResponse: string | null = null;
        try {
          // Set a timeout for the OpenAI call (5 seconds)
          const timeoutPromise = new Promise<string | null>((_, reject) => {
            setTimeout(() => reject(new Error('OpenAI request timeout')), 5000);
          });
          
          openAIResponse = await Promise.race([
            generateSmsResponse(Body, faqs, businessName, businessType, additionalInfo),
            timeoutPromise
          ]);
        } catch (error: any) {
          console.error(`[new-message] Error calling OpenAI:`, error.message);
          openAIResponse = null;
        }
        
        if (openAIResponse) {
          responseMessage = openAIResponse;
          responseSource = "openai";
          console.log(`[new-message] Generated OpenAI response (${openAIResponse.length} chars)`);
        } else {
          // Check for business-specific fallback message
          const customFallback = business.get('Custom Fallback Message');
          if (customFallback) {
            responseMessage = customFallback as string;
            responseSource = "custom_fallback";
            console.log(`[new-message] Using custom fallback message`);
          } else {
            responseMessage = "Sorry, we couldn't understand your question. Please call us directly.";
            responseSource = "default_fallback";
            console.log(`[new-message] Using default fallback message`);
          }
        }
      } else {
        responseMessage = "Thanks! A team member will follow up shortly.";
        responseSource = "default";
        console.log(`[new-message] OpenAI fallback disabled, using default message`);
      }
    }

    // Add request ID and timing for better monitoring
    const requestId = Math.random().toString(36).substring(2, 15);
    const startTime = Date.now();
    
    // Send the response via Twilio
    let messageSid: string;
    
    // Check if we're in test mode
    const testMode = isTestMode(req);
    
    // Handle non-Twilio numbers in test mode
    const isNonTwilioNumber = From === '+16193721633' || From.startsWith('+1619'); // Check for your personal number or area code
    
    if (testMode && isNonTwilioNumber) {
      // Mock the Twilio response in test mode
      console.log(`[new-message][${requestId}] TEST MODE: Mocking Twilio SMS for non-Twilio number ${From}`);
      messageSid = `mock-${requestId}`;
      console.log(`[new-message][${requestId}] Mock sent response to ${From}, message SID: ${messageSid}`);
    } else {
      try {
        // Use the sendSms function from lib/twilio.ts
        const { sendSms } = require('../../lib/twilio');
        const message = await sendSms({
          body: responseMessage,
          from: To,
          to: From,
          requestId
        });
        
        messageSid = message.sid;
      } catch (twilioError: any) {
        console.error(`[new-message][${requestId}] Twilio error:`, twilioError.message);
        
        // If in test mode, don't fail even on Twilio errors
        if (testMode) {
          console.log(`[new-message][${requestId}] TEST MODE: Ignoring Twilio error and proceeding with mock response`);
          messageSid = `mock-error-${requestId}`;
        } else {
          // Return error response but don't fail the whole request
          return res.status(200).json({
            success: false,
            requestId,
            businessId,
            businessName,
            matchedFaq: matchedFaq ? matchedFaq.question : null,
            responseMessage,
            responseSource,
            error: `Failed to send SMS: ${twilioError.message}`
          });
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`[new-message][${requestId}] Processing time: ${processingTime}ms`);

    // Return success response
    return res.status(200).json({
      success: true,
      requestId,
      businessId,
      businessName,
      matchedFaq: matchedFaq ? matchedFaq.question : null,
      responseMessage,
      responseSource,
      processingTime,
      messageSid
    });

  } catch (err: any) {
    console.error(`[new-message] Error:`, err.message);
    console.error(`[new-message] Stack:`, err.stack);

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
