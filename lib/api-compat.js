/**
 * API Compatibility Layer
 * 
 * This module provides a unified interface for functions that might have
 * different implementations in development vs. production environments.
 * It attempts to load the real implementations first, and falls back to
 * mock implementations if the real ones aren't available.
 */

// Mock implementations as fallbacks
const mockGetBusinessByPhoneNumber = async (phoneNumber) => {
  console.log(`[MOCK] Looking up business by phone number: ${phoneNumber}`);
  return {
    id: 'mock-business-id',
    name: 'Mock Business',
    subscription_tier: 'basic',
    customSettings: {},
    custom_settings: {}
  };
};

const mockLogCallEvent = async (eventData) => {
  console.log(`[MOCK] Logging call event:`, eventData);
  return null;
};

const mockTrackSmsEvent = async (eventData) => {
  console.log(`[MOCK] Tracking SMS event:`, eventData);
  return null;
};

const mockTrackOwnerAlert = async (alertData) => {
  console.log(`[MOCK] Tracking owner alert:`, alertData);
  return null;
};

// Try to load the real implementations
let supabaseModule;
let monitoringModule;

try {
  supabaseModule = require('./supabase.js');
} catch (error) {
  console.log('Supabase module not available, using mocks');
  supabaseModule = {
    getBusinessByPhoneNumberSupabase: mockGetBusinessByPhoneNumber,
    logCallEventSupabase: mockLogCallEvent
  };
}

try {
  monitoringModule = require('./monitoring.js');
} catch (error) {
  console.log('Monitoring module not available, using mocks');
  monitoringModule = {
    trackSmsEvent: mockTrackSmsEvent,
    trackOwnerAlert: mockTrackOwnerAlert
  };
}

// Export the best available implementations
export const getBusinessByPhoneNumberSupabase = supabaseModule.getBusinessByPhoneNumberSupabase || mockGetBusinessByPhoneNumber;
export const logCallEventSupabase = supabaseModule.logCallEventSupabase || mockLogCallEvent;
export const trackSmsEvent = monitoringModule.trackSmsEvent || mockTrackSmsEvent;
export const trackOwnerAlert = monitoringModule.trackOwnerAlert || mockTrackOwnerAlert;
