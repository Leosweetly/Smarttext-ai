/**
 * Preferences fixtures for the onboarding API test suite
 */

/**
 * Valid preferences data
 */
export const validPreferences = {
  notifications: {
    email: true,
    sms: true,
    push: false,
    frequency: 'immediate'
  },
  autoRespond: true,
  theme: 'light',
  language: 'en',
  timezone: 'America/Los_Angeles',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  analytics: {
    enabled: true,
    shareData: false
  },
  privacy: {
    showContactInfo: true,
    allowMarketing: false
  },
  display: {
    compactView: false,
    showAvatars: true,
    colorScheme: 'blue'
  }
};

/**
 * Invalid preferences data (missing required fields)
 */
export const invalidPreferences = {
  // Missing notifications
  autoRespond: true,
  // Missing theme
};

/**
 * Minimal preferences data (only required fields)
 */
export const minimalPreferences = {
  notifications: {
    email: false,
    sms: false,
    push: false,
    frequency: 'daily'
  },
  autoRespond: false,
  theme: 'system'
};

/**
 * Preferences data with special characters
 */
export const specialCharsPreferences = {
  notifications: {
    email: true,
    sms: true,
    push: false,
    frequency: 'immediate'
  },
  autoRespond: true,
  theme: 'custom-theme-name-with-special-chars-!@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./\\',
  language: 'en-US (Special "Variant")'
};

/**
 * Preferences data with very long values
 */
export const longPreferences = {
  notifications: {
    email: true,
    sms: true,
    push: false,
    frequency: 'immediate'
  },
  autoRespond: true,
  theme: 'A'.repeat(1000), // 1,000 character theme name
  language: 'B'.repeat(1000), // 1,000 character language name
  timezone: 'C'.repeat(1000) // 1,000 character timezone name
};

/**
 * Preferences data with empty values
 */
export const emptyPreferences = {
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
};

/**
 * Preferences data with all features enabled
 */
export const allEnabledPreferences = {
  notifications: {
    email: true,
    sms: true,
    push: true,
    frequency: 'immediate'
  },
  autoRespond: true,
  theme: 'dark',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  currency: 'EUR',
  analytics: {
    enabled: true,
    shareData: true
  },
  privacy: {
    showContactInfo: true,
    allowMarketing: true
  },
  display: {
    compactView: true,
    showAvatars: true,
    colorScheme: 'custom'
  }
};

/**
 * Preferences data with all features disabled
 */
export const allDisabledPreferences = {
  notifications: {
    email: false,
    sms: false,
    push: false,
    frequency: 'never'
  },
  autoRespond: false,
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  currency: 'USD',
  analytics: {
    enabled: false,
    shareData: false
  },
  privacy: {
    showContactInfo: false,
    allowMarketing: false
  },
  display: {
    compactView: false,
    showAvatars: false,
    colorScheme: 'default'
  }
};

export default {
  validPreferences,
  invalidPreferences,
  minimalPreferences,
  specialCharsPreferences,
  longPreferences,
  emptyPreferences,
  allEnabledPreferences,
  allDisabledPreferences
};
