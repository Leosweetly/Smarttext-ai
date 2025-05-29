/**
 * Mock Supabase module for testing
 * 
 * This file provides mock implementations of Supabase functions used in tests.
 */

// Default mock business with online_ordering_url field
const mockBusiness = {
  id: 'mock-business-id',
  name: 'Mock Business',
  business_type: 'restaurant',
  subscription_tier: 'basic',
  online_ordering_url: 'https://order.mockbusiness.com',
  custom_auto_reply: 'Thanks for calling Mock Business! We will call you back soon.',
  customSettings: {
    autoReplyEnabled: true,
    autoReplyMessage: "Thanks for calling! We'll get back to you as soon as possible."
  }
};

module.exports = {
  // By default, return null for business lookup
  getBusinessByPhoneNumberSupabase: jest.fn().mockResolvedValue(null),
  
  // Helper to set up mock to return a business with online_ordering_url
  mockBusinessWithOrderingUrl: () => {
    module.exports.getBusinessByPhoneNumberSupabase.mockResolvedValue(mockBusiness);
  },
  
  // Helper to set up mock to return a business without online_ordering_url
  mockBusinessWithoutOrderingUrl: () => {
    module.exports.getBusinessByPhoneNumberSupabase.mockResolvedValue({
      ...mockBusiness,
      online_ordering_url: null
    });
  },
  
  // Reset all mocks to their default state
  resetMocks: () => {
    module.exports.getBusinessByPhoneNumberSupabase.mockResolvedValue(null);
  },
  
  // Add other Supabase functions as needed
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis()
    })
  }
};
