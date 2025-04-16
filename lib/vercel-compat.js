/**
 * Vercel Compatibility Layer
 * 
 * This file provides compatibility for modules that might not be available
 * during the Vercel build process. It exports mock implementations of
 * functions from supabase.js and monitoring.js to prevent build failures.
 */

// Mock implementation of supabase functions
export const getBusinessByPhoneNumberSupabase = async (phoneNumber) => {
  console.log(`[MOCK] Looking up business by phone number: ${phoneNumber}`);
  return null;
};

export const logCallEventSupabase = async (eventData) => {
  console.log(`[MOCK] Logging call event:`, eventData);
  return null;
};

// Mock implementation of monitoring functions
export const trackSmsEvent = async (eventData) => {
  console.log(`[MOCK] Tracking SMS event:`, eventData);
  return null;
};

export const trackOwnerAlert = async (alertData) => {
  console.log(`[MOCK] Tracking owner alert:`, alertData);
  return null;
};
