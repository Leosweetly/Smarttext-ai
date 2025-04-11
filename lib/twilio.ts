/**
 * Twilio SMS Module
 * 
 * This module provides functions to send SMS messages using Twilio.
 * It includes proper error handling and logging.
 */

import twilio from 'twilio';

// Validate that required environment variables are set
const validateEnvVars = (): void => {
  const requiredVars = ['TWILIO_SID', 'TWILIO_AUTH_TOKEN'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

/**
 * Send an SMS message using Twilio
 * @param {Object} options - SMS options
 * @param {string} options.body - The message body
 * @param {string} options.from - The sender's phone number (E.164 format)
 * @param {string} options.to - The recipient's phone number (E.164 format)
 * @param {string} options.requestId - Optional request ID for tracking
 * @returns {Promise<Object>} The Twilio message object
 */
export async function sendSms({ body, from, to, requestId = '' }: { 
  body: string; 
  from: string; 
  to: string; 
  requestId?: string;
}): Promise<any> {
  try {
    // Validate environment variables
    validateEnvVars();
    
    // Log the request
    const logPrefix = requestId ? `[sendSms][${requestId}]` : '[sendSms]';
    console.log(`${logPrefix} Sending SMS from ${from} to ${to}`);
    
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
    
    // Log success
    console.log(`${logPrefix} Successfully sent SMS, message SID: ${message.sid}`);
    
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
    
    // Re-throw the error for the caller to handle
    throw error;
  }
}
