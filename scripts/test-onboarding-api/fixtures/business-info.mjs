/**
 * Business info fixtures for the onboarding API test suite
 */

/**
 * Valid business info data
 */
export const validBusinessInfo = {
  name: 'Test Business',
  businessType: 'retail',
  address: '123 Test St, Test City, TS 12345',
  phone: '+15551234567',
  email: 'test@example.com',
  website: 'https://example.com',
  description: 'A test business for the onboarding API test suite',
  logo: 'https://example.com/logo.png',
  hours: {
    monday: '9:00 AM - 5:00 PM',
    tuesday: '9:00 AM - 5:00 PM',
    wednesday: '9:00 AM - 5:00 PM',
    thursday: '9:00 AM - 5:00 PM',
    friday: '9:00 AM - 5:00 PM',
    saturday: 'Closed',
    sunday: 'Closed'
  },
  socialMedia: {
    facebook: 'https://facebook.com/testbusiness',
    twitter: 'https://twitter.com/testbusiness',
    instagram: 'https://instagram.com/testbusiness'
  }
};

/**
 * Invalid business info data (missing required fields)
 */
export const invalidBusinessInfo = {
  // Missing name
  businessType: 'retail',
  address: '123 Test St, Test City, TS 12345'
};

/**
 * Minimal business info data (only required fields)
 */
export const minimalBusinessInfo = {
  name: 'Minimal Test Business',
  businessType: 'service',
  address: '456 Test Ave, Test Town, TS 54321'
};

/**
 * Business info data with special characters
 */
export const specialCharsBusinessInfo = {
  name: 'Test Business & Co. (Special Chars) "Test"',
  businessType: 'retail & service',
  address: '123 Test St. #456, Test City, TS 12345-6789',
  description: 'This description has special characters: !@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./\nAnd a new line'
};

/**
 * Business info data with very long values
 */
export const longBusinessInfo = {
  name: 'Very Long Business Name That Exceeds Normal Length Limits And Might Cause Issues With Display Or Storage In Some Systems That Have Not Been Properly Designed To Handle Edge Cases Like This One',
  businessType: 'retail',
  address: '123 Very Long Street Name That Exceeds Normal Length Limits And Might Cause Issues With Display Or Storage In Some Systems That Have Not Been Properly Designed To Handle Edge Cases Like This One, Very Long City Name That Exceeds Normal Length Limits And Might Cause Issues With Display Or Storage In Some Systems That Have Not Been Properly Designed To Handle Edge Cases Like This One, TS 12345',
  description: 'A'.repeat(10000) // 10,000 character description
};

/**
 * Business info data with empty values
 */
export const emptyBusinessInfo = {
  name: '',
  businessType: '',
  address: ''
};

export default {
  validBusinessInfo,
  invalidBusinessInfo,
  minimalBusinessInfo,
  specialCharsBusinessInfo,
  longBusinessInfo,
  emptyBusinessInfo
};
