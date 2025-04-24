/**
 * API Compatibility Layer
 * 
 * This module provides a unified interface for functions that might have
 * different implementations in development vs. production environments.
 * It attempts to load the real implementations first, and falls back to
 * mock implementations if the real ones aren't available.
 * 
 * During the migration from Airtable to Supabase, this layer also handles
 * shadow writes to both databases and logs the results.
 */

import { logMigrationOperation } from './migration-logger.js';

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
let airtableModule;

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

try {
  airtableModule = require('./airtable.js');
} catch (error) {
  console.log('Airtable module not available, using mocks');
  airtableModule = {
    getBusinessByPhoneNumber: mockGetBusinessByPhoneNumber,
    logMissedCall: mockLogCallEvent
  };
}

// Configuration for the migration
const MIGRATION_CONFIG = {
  // Set to false to stop writing to Airtable (Phase 3)
  ENABLE_SHADOW_WRITES: false,
  
  // Set to true to prioritize Supabase over Airtable for reads
  PRIORITIZE_SUPABASE: true,
  
  // Set to true to log all operations to the migration logs table
  ENABLE_MIGRATION_LOGGING: true
};

/**
 * Get a business by phone number, with migration handling
 * @param {string} phoneNumber - The phone number to look up
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessByPhoneNumberSupabase(phoneNumber) {
  let supabaseResult = null;
  let airtableResult = null;
  let supabaseSuccess = false;
  let airtableSuccess = false;
  let errorMessage = null;
  
  // Try Supabase first
  try {
    supabaseResult = await supabaseModule.getBusinessByPhoneNumberSupabase(phoneNumber);
    supabaseSuccess = !!supabaseResult;
  } catch (error) {
    console.error('Error getting business from Supabase:', error);
    errorMessage = error.message;
  }
  
  // Try Airtable if shadow writes are enabled or Supabase failed
  if (MIGRATION_CONFIG.ENABLE_SHADOW_WRITES || (!supabaseSuccess && !MIGRATION_CONFIG.PRIORITIZE_SUPABASE)) {
    try {
      airtableResult = await airtableModule.getBusinessByPhoneNumber(phoneNumber);
      airtableSuccess = !!airtableResult;
    } catch (error) {
      console.error('Error getting business from Airtable:', error);
      if (!errorMessage) errorMessage = error.message;
    }
  }
  
  // Log the operation if logging is enabled
  if (MIGRATION_CONFIG.ENABLE_MIGRATION_LOGGING) {
    const entityId = (supabaseResult?.id || airtableResult?.id || 'unknown') + '-' + phoneNumber;
    await logMigrationOperation({
      operation: 'read',
      entityType: 'business',
      entityId,
      airtableSuccess,
      supabaseSuccess,
      errorMessage
    }).catch(err => console.error('Error logging migration operation:', err));
  }
  
  // Return the appropriate result based on configuration
  if (MIGRATION_CONFIG.PRIORITIZE_SUPABASE) {
    return supabaseResult || airtableResult;
  } else {
    return airtableResult || supabaseResult;
  }
}

/**
 * Log a call event with migration handling
 * @param {Object} eventData - The call event data
 * @returns {Promise<Object|null>} The created event object or null if error
 */
export async function logCallEventSupabase(eventData) {
  let supabaseResult = null;
  let airtableResult = null;
  let supabaseSuccess = false;
  let airtableSuccess = false;
  let errorMessage = null;
  
  // Try Supabase first
  try {
    supabaseResult = await supabaseModule.logCallEventSupabase(eventData);
    supabaseSuccess = !!supabaseResult;
  } catch (error) {
    console.error('Error logging call event to Supabase:', error);
    errorMessage = error.message;
  }
  
  // Try Airtable if shadow writes are enabled
  if (MIGRATION_CONFIG.ENABLE_SHADOW_WRITES) {
    try {
      // Map the event data to Airtable format
      const airtableEventData = {
        callerNumber: eventData.from,
        businessNumber: eventData.to,
        businessId: eventData.businessId,
        callStatus: eventData.callStatus || eventData.event_type,
        ownerNotified: eventData.ownerNotified
      };
      
      airtableResult = await airtableModule.logMissedCall(airtableEventData);
      airtableSuccess = !!airtableResult;
    } catch (error) {
      console.error('Error logging call event to Airtable:', error);
      if (!errorMessage) errorMessage = error.message;
    }
  }
  
  // Log the operation if logging is enabled
  if (MIGRATION_CONFIG.ENABLE_MIGRATION_LOGGING) {
    await logMigrationOperation({
      operation: 'write',
      entityType: 'call_event',
      entityId: eventData.callSid || 'unknown',
      airtableSuccess,
      supabaseSuccess,
      errorMessage
    }).catch(err => console.error('Error logging migration operation:', err));
  }
  
  // Return the Supabase result (prioritize Supabase for writes)
  return supabaseResult;
}

// Export monitoring functions
export const trackSmsEvent = monitoringModule.trackSmsEvent || mockTrackSmsEvent;
export const trackOwnerAlert = monitoringModule.trackOwnerAlert || mockTrackOwnerAlert;
