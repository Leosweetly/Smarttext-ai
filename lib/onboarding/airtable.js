/**
 * Airtable implementation for onboarding
 * 
 * This file provides the Airtable functions used for onboarding.
 * It interacts with the Airtable API to store and retrieve onboarding data.
 */

import { getAirtableClient } from '../airtable.js';

/**
 * Save onboarding data to Airtable for a business
 * @param {string} businessId - The business ID
 * @param {Object} onboardingData - The onboarding data to save
 * @returns {Promise<Object>} The saved onboarding data
 */
export async function saveOnboardingToAirtable(businessId, onboardingData) {
  try {
    // Get Airtable client
    const airtable = await getAirtableClient();
    
    // Prepare data for Airtable
    const airtableData = {
      UserId: onboardingData.userId,
      BusinessId: businessId,
      BusinessInfoCompleted: onboardingData.steps.businessInfo.completed,
      BusinessInfoData: JSON.stringify(onboardingData.steps.businessInfo.data),
      PhoneSetupCompleted: onboardingData.steps.phoneSetup.completed,
      PhoneSetupData: JSON.stringify(onboardingData.steps.phoneSetup.data),
      PreferencesCompleted: onboardingData.steps.preferences.completed,
      PreferencesData: JSON.stringify(onboardingData.steps.preferences.data),
      CurrentStep: onboardingData.currentStep,
      Completed: onboardingData.completed,
      LastUpdated: onboardingData.lastUpdated
    };
    
    // Create a new record
    const record = await airtable('Onboarding').create(airtableData);
    
    return {
      id: record.id,
      ...onboardingData
    };
  } catch (error) {
    console.error('Error saving onboarding data to Airtable:', error);
    throw error;
  }
}

// Default onboarding data
const defaultOnboardingData = {
  userId: '',
  steps: {
    businessInfo: {
      completed: false,
      data: {
        name: '',
        businessType: '',
        address: ''
      }
    },
    phoneSetup: {
      completed: false,
      data: {
        phoneNumber: '',
        configured: false
      }
    },
    preferences: {
      completed: false,
      data: {
        notifications: {
          email: false,
          sms: false,
          push: false,
          frequency: 'daily'
        },
        autoRespond: false,
        theme: 'system'
      }
    }
  },
  currentStep: 'businessInfo',
  completed: false,
  lastUpdated: new Date().toISOString()
};

/**
 * Get onboarding data for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Onboarding data
 */
export async function getOnboardingData(userId) {
  try {
    // Get Airtable client
    const airtable = await getAirtableClient();
    
    // Get onboarding data from Airtable
    const records = await airtable('Onboarding')
      .select({
        filterByFormula: `{UserId} = '${userId}'`,
        maxRecords: 1
      })
      .firstPage();
    
    // If no record found, return default data
    if (!records || records.length === 0) {
      return {
        ...defaultOnboardingData,
        userId
      };
    }
    
    // Get the record
    const record = records[0];
    
    // Parse the data
    const data = {
      userId,
      steps: {
        businessInfo: {
          completed: record.get('BusinessInfoCompleted') || false,
          data: JSON.parse(record.get('BusinessInfoData') || '{}')
        },
        phoneSetup: {
          completed: record.get('PhoneSetupCompleted') || false,
          data: JSON.parse(record.get('PhoneSetupData') || '{}')
        },
        preferences: {
          completed: record.get('PreferencesCompleted') || false,
          data: JSON.parse(record.get('PreferencesData') || '{}')
        }
      },
      currentStep: record.get('CurrentStep') || 'businessInfo',
      completed: record.get('Completed') || false,
      lastUpdated: record.get('LastUpdated') || new Date().toISOString()
    };
    
    return data;
  } catch (error) {
    console.error('Error getting onboarding data from Airtable:', error);
    
    // Return default data on error
    return {
      ...defaultOnboardingData,
      userId
    };
  }
}

/**
 * Update onboarding data for a user
 * @param {string} userId - The user ID
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} Updated onboarding data
 */
export async function updateOnboardingData(userId, data) {
  try {
    // Get Airtable client
    const airtable = await getAirtableClient();
    
    // Get existing data
    const existingData = await getOnboardingData(userId);
    
    // Merge the data
    const mergedData = deepMerge(existingData, data);
    
    // Update lastUpdated timestamp
    mergedData.lastUpdated = new Date().toISOString();
    
    // Prepare data for Airtable
    const airtableData = {
      UserId: userId,
      BusinessInfoCompleted: mergedData.steps.businessInfo.completed,
      BusinessInfoData: JSON.stringify(mergedData.steps.businessInfo.data),
      PhoneSetupCompleted: mergedData.steps.phoneSetup.completed,
      PhoneSetupData: JSON.stringify(mergedData.steps.phoneSetup.data),
      PreferencesCompleted: mergedData.steps.preferences.completed,
      PreferencesData: JSON.stringify(mergedData.steps.preferences.data),
      CurrentStep: mergedData.currentStep,
      Completed: mergedData.completed,
      LastUpdated: mergedData.lastUpdated
    };
    
    // Get existing records
    const records = await airtable('Onboarding')
      .select({
        filterByFormula: `{UserId} = '${userId}'`,
        maxRecords: 1
      })
      .firstPage();
    
    // If record exists, update it
    if (records && records.length > 0) {
      await airtable('Onboarding').update(records[0].id, airtableData);
    } else {
      // Otherwise, create a new record
      await airtable('Onboarding').create(airtableData);
    }
    
    return mergedData;
  } catch (error) {
    console.error('Error updating onboarding data in Airtable:', error);
    throw error;
  }
}

/**
 * Reset onboarding data for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Reset onboarding data
 */
export async function resetOnboardingData(userId) {
  try {
    // Get Airtable client
    const airtable = await getAirtableClient();
    
    // Get existing records
    const records = await airtable('Onboarding')
      .select({
        filterByFormula: `{UserId} = '${userId}'`,
        maxRecords: 1
      })
      .firstPage();
    
    // If record exists, delete it
    if (records && records.length > 0) {
      await airtable('Onboarding').destroy(records[0].id);
    }
    
    // Return default data
    return {
      ...defaultOnboardingData,
      userId,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error resetting onboarding data in Airtable:', error);
    throw error;
  }
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] === undefined) {
      continue;
    }

    if (
      isObject(source[key]) &&
      key in target &&
      isObject(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

/**
 * Check if a value is an object
 * @param {*} item - Value to check
 * @returns {boolean} Whether the value is an object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export default {
  getOnboardingData,
  updateOnboardingData,
  resetOnboardingData
};
