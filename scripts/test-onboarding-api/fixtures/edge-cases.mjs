/**
 * Edge case fixtures for the onboarding API test suite
 */

import { validBusinessInfo } from './business-info.mjs';
import { validPhoneSetup } from './phone-setup.mjs';
import { validPreferences } from './preferences.mjs';

/**
 * Very large onboarding data
 */
export const largeOnboardingData = {
  userId: 'test-user-id',
  steps: {
    businessInfo: {
      completed: true,
      data: {
        name: 'A'.repeat(10000), // 10,000 character name
        businessType: 'B'.repeat(10000), // 10,000 character business type
        address: 'C'.repeat(10000), // 10,000 character address
        description: 'D'.repeat(100000), // 100,000 character description
        // Add more large fields
        extraData: Array(1000).fill('Large data item').join(',') // Large array
      }
    },
    phoneSetup: {
      completed: true,
      data: {
        phoneNumber: '+15551234567',
        configured: true,
        voicemailGreeting: 'E'.repeat(50000), // 50,000 character greeting
        smsAutoReplyMessage: 'F'.repeat(50000) // 50,000 character SMS auto-reply
      }
    },
    preferences: {
      completed: true,
      data: {
        notifications: {
          email: true,
          sms: true,
          push: true,
          frequency: 'G'.repeat(10000) // 10,000 character frequency
        },
        autoRespond: true,
        theme: 'H'.repeat(10000), // 10,000 character theme
        language: 'I'.repeat(10000), // 10,000 character language
        timezone: 'J'.repeat(10000) // 10,000 character timezone
      }
    }
  },
  currentStep: 'preferences',
  completed: true,
  lastUpdated: new Date().toISOString(),
  // Add a large array of custom fields
  customFields: Array(1000).fill({
    name: 'Custom field',
    value: 'K'.repeat(1000) // 1,000 character value
  })
};

/**
 * Onboarding data with special characters
 */
export const specialCharsOnboardingData = {
  userId: 'test-user-id',
  steps: {
    businessInfo: {
      completed: true,
      data: {
        name: 'Test Business & Co. (Special Chars) "Test"',
        businessType: 'retail & service',
        address: '123 Test St. #456, Test City, TS 12345-6789',
        description: 'This description has special characters: !@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./\nAnd a new line'
      }
    },
    phoneSetup: {
      completed: true,
      data: {
        phoneNumber: '+1 (555) 123-4567',
        configured: true,
        voicemailGreeting: 'Hello! This is a "special" greeting with characters like: !@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./\nAnd a new line'
      }
    },
    preferences: {
      completed: true,
      data: {
        notifications: {
          email: true,
          sms: true,
          push: false,
          frequency: 'immediate'
        },
        autoRespond: true,
        theme: 'custom-theme-name-with-special-chars-!@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./\\',
        language: 'en-US (Special "Variant")'
      }
    }
  },
  currentStep: 'preferences',
  completed: true,
  lastUpdated: new Date().toISOString()
};

/**
 * Onboarding data with missing fields
 */
export const missingFieldsOnboardingData = {
  userId: 'test-user-id',
  steps: {
    businessInfo: {
      // Missing completed field
      data: {
        // Missing name field
        businessType: 'retail',
        address: '123 Test St, Test City, TS 12345'
      }
    },
    // Missing phoneSetup step
    preferences: {
      completed: true,
      // Missing data field
    }
  },
  // Missing currentStep field
  completed: true,
  lastUpdated: new Date().toISOString()
};

/**
 * Onboarding data with wrong types
 */
export const wrongTypesOnboardingData = {
  userId: 123, // Should be string
  steps: {
    businessInfo: {
      completed: 'yes', // Should be boolean
      data: {
        name: 123, // Should be string
        businessType: true, // Should be string
        address: ['123 Test St', 'Test City', 'TS 12345'] // Should be string
      }
    },
    phoneSetup: {
      completed: 1, // Should be boolean
      data: {
        phoneNumber: 5551234567, // Should be string
        configured: 'true' // Should be boolean
      }
    },
    preferences: {
      completed: 'true', // Should be boolean
      data: {
        notifications: 'all', // Should be object
        autoRespond: 1, // Should be boolean
        theme: ['light'] // Should be string
      }
    }
  },
  currentStep: 123, // Should be string
  completed: 'yes', // Should be boolean
  lastUpdated: 1616161616161 // Should be ISO date string
};

/**
 * Onboarding data with empty values
 */
export const emptyValuesOnboardingData = {
  userId: 'test-user-id',
  steps: {
    businessInfo: {
      completed: true,
      data: {
        name: '',
        businessType: '',
        address: ''
      }
    },
    phoneSetup: {
      completed: true,
      data: {
        phoneNumber: '',
        configured: false,
        forwardingNumber: '',
        voicemailGreeting: '',
        smsAutoReplyMessage: ''
      }
    },
    preferences: {
      completed: true,
      data: {
        notifications: {
          email: false,
          sms: false,
          push: false,
          frequency: ''
        },
        autoRespond: false,
        theme: '',
        language: '',
        timezone: ''
      }
    }
  },
  currentStep: '',
  completed: false,
  lastUpdated: new Date().toISOString()
};

/**
 * Complete onboarding data
 */
export const completeOnboardingData = {
  userId: 'test-user-id',
  steps: {
    businessInfo: {
      completed: true,
      data: validBusinessInfo
    },
    phoneSetup: {
      completed: true,
      data: validPhoneSetup
    },
    preferences: {
      completed: true,
      data: validPreferences
    }
  },
  currentStep: 'preferences',
  completed: true,
  lastUpdated: new Date().toISOString()
};

/**
 * Partial onboarding data (some steps completed)
 */
export const partialOnboardingData = {
  userId: 'test-user-id',
  steps: {
    businessInfo: {
      completed: true,
      data: validBusinessInfo
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
  currentStep: 'phoneSetup',
  completed: false,
  lastUpdated: new Date().toISOString()
};

export default {
  largeOnboardingData,
  specialCharsOnboardingData,
  missingFieldsOnboardingData,
  wrongTypesOnboardingData,
  emptyValuesOnboardingData,
  completeOnboardingData,
  partialOnboardingData
};
