/**
 * Twilio SMS Module
 * 
 * This module provides functions to send SMS messages using Twilio.
 * It includes proper error handling, logging, and rate-limiting.
 */

import twilio from 'twilio';
import { trackSmsEvent } from './monitoring';

// In-memory store for SMS rate limiting
// Maps phone numbers to timestamps of last SMS sent
const smsTimestamps = new Map<string, number>();

// Rate-limiting configuration (can be moved to environment variables)
const SMS_COOLDOWN_PERIOD = 10 * 60 * 1000; // 10 minutes in milliseconds

// Validate that required environment variables are set
const validateEnvVars = (): void => {
  const requiredVars = ['TWILIO_SID', 'TWILIO_AUTH_TOKEN'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

/**
 * Check if a number is rate-limited for SMS
 * @param {string} phoneNumber - The phone number to check
 * @returns {boolean} True if rate-limited, false otherwise
 */
const isRateLimited = (phoneNumber: string): boolean => {
  const now = Date.now();
  const lastSent = smsTimestamps.get(phoneNumber);
  
  if (lastSent && (now - lastSent < SMS_COOLDOWN_PERIOD)) {
    const secondsAgo = Math.round((now - lastSent) / 1000);
    console.log(`⏱️ Rate-limited: SMS to ${phoneNumber} would be sent too soon (${secondsAgo}s ago)`);
    return true;
  }
  
  return false;
};

/**
 * Update the timestamp for a phone number
 * @param {string} phoneNumber - The phone number to update
 */
const updateSmsTimestamp = (phoneNumber: string): void => {
  smsTimestamps.set(phoneNumber, Date.now());
  console.log(`⏱️ Updated SMS timestamp for ${phoneNumber}`);
  
  // Log the current state of the rate-limiting cache (for debugging)
  console.log(`📊 Current SMS rate-limiting cache size: ${smsTimestamps.size}`);
};

/**
 * Send an SMS message using Twilio
 * @param {Object} options - SMS options
 * @param {string} options.body - The message body
 * @param {string} options.from - The sender's phone number (E.164 format)
 * @param {string} options.to - The recipient's phone number (E.164 format)
 * @param {string} options.requestId - Optional request ID for tracking
 * @param {boolean} options.bypassRateLimit - Optional flag to bypass rate limiting
 * @returns {Promise<Object>} The Twilio message object
 */
export async function sendSms({ 
  body, 
  from, 
  to, 
  requestId = '',
  bypassRateLimit = false
}: { 
  body: string; 
  from: string; 
  to: string; 
  requestId?: string;
  bypassRateLimit?: boolean;
}): Promise<any> {
  try {
    // Validate environment variables
    validateEnvVars();
    
    // Log the request
    const logPrefix = requestId ? `[sendSms][${requestId}]` : '[sendSms]';
    console.log(`${logPrefix} Request to send SMS from ${from} to ${to}`);
    
    // Check rate limiting (unless bypassed)
    if (!bypassRateLimit && isRateLimited(to)) {
      console.log(`${logPrefix} SMS to ${to} rate-limited, skipping`);
      return {
        sid: 'RATE_LIMITED',
        status: 'skipped',
        to,
        from,
        body: 'Rate limited',
        rateLimited: true
      };
    }
    
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Send the message
    const message = await client.messages.create({
      body,
      from,
      to
    });
    
    // Update rate-limiting timestamp
    updateSmsTimestamp(to);
    
    // Log success
    console.log(`${logPrefix} Successfully sent SMS, message SID: ${message.sid}`);
    
    // Track the successful SMS event
    trackSmsEvent({
      messageSid: message.sid,
      from,
      to,
      businessId: extractBusinessId(from, to),
      status: message.status || 'sent',
      errorCode: null,
      errorMessage: null,
      requestId,
      bodyLength: body.length,
      payload: { message }
    }).catch(err => {
      console.error(`${logPrefix} Error tracking SMS event:`, err);
    });
    
    return message;
  } catch (error: any) {
    // Log the error
    console.error(`[sendSms] Error sending SMS from ${from} to ${to}:`, error.message);
    
    // Add specific error handling for common Twilio errors
    if (error.code === 21608) {
      console.error('[sendSms] Error 21608: The "From" phone number provided is not a valid, SMS-capable Twilio phone number.');
    } else if (error.code === 21211) {
      console.error('[sendSms] Error 21211: The "To" phone number is not a valid phone number.');
    } else if (error.code === 20003) {
      console.error('[sendSms] Error 20003: Authentication Error - Your Twilio credentials are invalid.');
    }
    
    // Track the failed SMS event
    trackSmsEvent({
      messageSid: '',
      from,
      to,
      businessId: extractBusinessId(from, to),
      status: 'failed',
      errorCode: error.code?.toString() || 'unknown',
      errorMessage: error.message || 'Unknown error',
      requestId,
      bodyLength: body.length,
      payload: { error: { code: error.code, message: error.message } }
    }).catch(err => {
      console.error(`[sendSms] Error tracking failed SMS event:`, err);
    });
    
    // Re-throw the error for the caller to handle
    throw error;
  }
}

/**
 * Get the time remaining until a number can receive another SMS
 * @param {string} phoneNumber - The phone number to check
 * @returns {number} Time remaining in milliseconds, or 0 if not rate-limited
 */
export function getSmsRateLimitTimeRemaining(phoneNumber: string): number {
  const now = Date.now();
  const lastSent = smsTimestamps.get(phoneNumber);
  
  if (!lastSent) {
    return 0;
  }
  
  const timeElapsed = now - lastSent;
  const timeRemaining = SMS_COOLDOWN_PERIOD - timeElapsed;
  
  return timeRemaining > 0 ? timeRemaining : 0;
}

/**
 * Clear rate-limiting for a phone number (for testing or admin purposes)
 * @param {string} phoneNumber - The phone number to clear
 */
export function clearSmsRateLimit(phoneNumber: string): void {
  smsTimestamps.delete(phoneNumber);
  console.log(`⏱️ Cleared SMS rate-limiting for ${phoneNumber}`);
}

/**
 * Helper function to extract business ID from phone numbers
 * This is a best-effort approach - in real usage, the business ID should be passed explicitly
 * @param {string} from - From phone number
 * @param {string} to - To phone number
 * @returns {string|null} - Business ID if it can be determined, null otherwise
 */
function extractBusinessId(from: string, to: string): string | null {
  // In most cases, the 'from' number is the Twilio number associated with a business
  // This is a placeholder - in production, you would look up the business ID from the phone number
  return null;
}
