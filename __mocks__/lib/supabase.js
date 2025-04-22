/**
 * Mock Supabase module for testing
 * 
 * This file provides mock implementations of Supabase functions used in tests.
 */

module.exports = {
  getBusinessByPhoneNumberSupabase: jest.fn().mockResolvedValue(null),
  // Add other Supabase functions as needed
};
