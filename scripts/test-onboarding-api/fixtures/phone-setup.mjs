/**
 * Phone setup fixtures for the onboarding API test suite
 */

/**
 * Valid phone setup data
 */
export const validPhoneSetup = {
  phoneNumber: '+15551234567',
  configured: true,
  forwardingEnabled: true,
  forwardingNumber: '+15559876543',
  voicemailEnabled: true,
  voicemailGreeting: 'Thank you for calling Test Business. Please leave a message.',
  smsAutoReplyEnabled: true,
  smsAutoReplyMessage: 'Thank you for your message. We will get back to you as soon as possible.',
  callScreeningEnabled: false,
  businessHoursOnly: true,
  businessHours: {
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '17:00', enabled: true },
    saturday: { start: '10:00', end: '15:00', enabled: false },
    sunday: { start: '10:00', end: '15:00', enabled: false }
  }
};

/**
 * Invalid phone setup data (missing required fields)
 */
export const invalidPhoneSetup = {
  // Missing phoneNumber
  configured: true,
  forwardingEnabled: true
};

/**
 * Minimal phone setup data (only required fields)
 */
export const minimalPhoneSetup = {
  phoneNumber: '+15551234567',
  configured: false
};

/**
 * Phone setup data with special characters
 */
export const specialCharsPhoneSetup = {
  phoneNumber: '+1 (555) 123-4567',
  configured: true,
  voicemailGreeting: 'Hello! This is a "special" greeting with characters like: !@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./\nAnd a new line'
};

/**
 * Phone setup data with very long values
 */
export const longPhoneSetup = {
  phoneNumber: '+15551234567',
  configured: true,
  voicemailGreeting: 'A'.repeat(5000), // 5,000 character greeting
  smsAutoReplyMessage: 'B'.repeat(5000) // 5,000 character SMS auto-reply
};

/**
 * Phone setup data with empty values
 */
export const emptyPhoneSetup = {
  phoneNumber: '',
  configured: false,
  forwardingNumber: '',
  voicemailGreeting: '',
  smsAutoReplyMessage: ''
};

/**
 * Phone setup data with international numbers
 */
export const internationalPhoneSetup = {
  phoneNumber: '+447700900123', // UK
  configured: true,
  forwardingEnabled: true,
  forwardingNumber: '+33123456789' // France
};

export default {
  validPhoneSetup,
  invalidPhoneSetup,
  minimalPhoneSetup,
  specialCharsPhoneSetup,
  longPhoneSetup,
  emptyPhoneSetup,
  internationalPhoneSetup
};
