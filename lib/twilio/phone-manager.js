/**
 * Twilio Phone Number Management Module
 * 
 * This module provides functions to programmatically configure Twilio phone numbers
 * for the SmartText AI platform. It allows for automated setup of voice URLs and
 * status callbacks for missed call handling.
 */

import twilio from 'twilio';

/**
 * Configure a single Twilio phone number with the appropriate webhooks
 * @param {string} phoneNumber - The phone number to configure (E.164 format, e.g. +18186518560)
 * @param {Object} options - Configuration options
 * @param {string} options.voiceUrl - The TwiML Bin URL for handling incoming calls
 * @param {string} options.statusCallback - The webhook URL for status callbacks
 * @returns {Promise<Object>} Result of the configuration
 */
export async function configureTwilioNumber(phoneNumber, options = {}) {
  try {
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Find the phone number in your Twilio account
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: phoneNumber
    });
    
    if (incomingPhoneNumbers.length === 0) {
      throw new Error(`Phone number ${phoneNumber} not found in Twilio account`);
    }
    
    const numberSid = incomingPhoneNumbers[0].sid;
    
    // Default values
    const voiceUrl = options.voiceUrl || 
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/twilio/voice`;
    const statusCallback = options.statusCallback || 
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/missed-call`;
    
    // Update the phone number configuration
    const updatedNumber = await client.incomingPhoneNumbers(numberSid).update({
      voiceUrl: voiceUrl,
      statusCallback: statusCallback,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['completed', 'no-answer', 'busy', 'failed']
    });
    
    console.log(`Successfully configured Twilio number: ${phoneNumber}`);
    
    return { 
      success: true, 
      phoneNumber, 
      numberSid,
      voiceUrl,
      statusCallback
    };
  } catch (error) {
    console.error(`Error configuring Twilio number ${phoneNumber}:`, error);
    throw error;
  }
}

/**
 * Configure multiple Twilio phone numbers in bulk
 * @param {Array<Object>} businesses - Array of business objects with phoneNumber property
 * @param {Object} options - Configuration options (same as configureTwilioNumber)
 * @returns {Promise<Object>} Results of the bulk configuration
 */
export async function bulkConfigureTwilioNumbers(businesses, options = {}) {
  const results = {
    success: [],
    failed: []
  };
  
  for (const business of businesses) {
    try {
      const result = await configureTwilioNumber(business.phoneNumber, options);
      results.success.push({
        businessId: business.id,
        businessName: business.name,
        phoneNumber: business.phoneNumber,
        ...result
      });
    } catch (error) {
      results.failed.push({
        businessId: business.id,
        businessName: business.name,
        phoneNumber: business.phoneNumber,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Purchase a new Twilio phone number and configure it
 * @param {Object} options - Options for purchasing and configuring the number
 * @param {string} options.areaCode - The area code to search for available numbers
 * @param {string} options.voiceUrl - The TwiML Bin URL for handling incoming calls
 * @param {string} options.statusCallback - The webhook URL for status callbacks
 * @returns {Promise<Object>} The purchased and configured phone number
 */
export async function purchaseAndConfigureTwilioNumber(options = {}) {
  try {
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Search for available phone numbers
    const areaCode = options.areaCode || '818'; // Default area code
    const availableNumbers = await client.availablePhoneNumbers('US')
      .local.list({ areaCode, limit: 1 });
    
    if (availableNumbers.length === 0) {
      throw new Error(`No available phone numbers found in area code ${areaCode}`);
    }
    
    // Purchase the phone number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: availableNumbers[0].phoneNumber,
      friendlyName: options.friendlyName || 'SmartText AI Auto-Response'
    });
    
    // Configure the purchased number
    const voiceUrl = options.voiceUrl || 
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/twilio/voice`;
    const statusCallback = options.statusCallback || 
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/missed-call`;
    
    const configuredNumber = await client.incomingPhoneNumbers(purchasedNumber.sid).update({
      voiceUrl: voiceUrl,
      statusCallback: statusCallback,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['completed', 'no-answer', 'busy', 'failed']
    });
    
    console.log(`Successfully purchased and configured Twilio number: ${configuredNumber.phoneNumber}`);
    
    return {
      success: true,
      phoneNumber: configuredNumber.phoneNumber,
      numberSid: configuredNumber.sid,
      voiceUrl,
      statusCallback
    };
  } catch (error) {
    console.error('Error purchasing and configuring Twilio number:', error);
    throw error;
  }
}

/**
 * Get the configuration status of a Twilio phone number
 * @param {string} phoneNumber - The phone number to check (E.164 format)
 * @returns {Promise<Object>} The current configuration status
 */
export async function getTwilioNumberStatus(phoneNumber) {
  try {
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Find the phone number in your Twilio account
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: phoneNumber
    });
    
    if (incomingPhoneNumbers.length === 0) {
      return {
        exists: false,
        phoneNumber,
        message: `Phone number ${phoneNumber} not found in Twilio account`
      };
    }
    
    const number = incomingPhoneNumbers[0];
    
    // Check if the number is properly configured
    const expectedVoiceUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/twilio/voice`;
    const expectedStatusCallback = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/missed-call`;
    
    const isConfigured = 
      number.voiceUrl === expectedVoiceUrl &&
      number.statusCallback === expectedStatusCallback &&
      number.statusCallbackMethod === 'POST' &&
      Array.isArray(number.statusCallbackEvent) &&
      number.statusCallbackEvent.includes('no-answer');
    
    return {
      exists: true,
      isConfigured,
      phoneNumber,
      numberSid: number.sid,
      friendlyName: number.friendlyName,
      voiceUrl: number.voiceUrl,
      statusCallback: number.statusCallback,
      statusCallbackMethod: number.statusCallbackMethod,
      statusCallbackEvent: number.statusCallbackEvent
    };
  } catch (error) {
    console.error(`Error checking Twilio number status for ${phoneNumber}:`, error);
    throw error;
  }
}
