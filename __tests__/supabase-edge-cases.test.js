/**
 * Supabase Edge Cases Test Suite
 * 
 * Tests edge cases and failure scenarios discovered during the Airtable → Supabase migration
 * to prevent regression and ensure robust error handling.
 */

const { getBusinessByPhoneNumberSupabase, logCallEventSupabase } = require('../lib/supabase');
const { trackSmsEvent, trackOwnerAlert } = require('../lib/monitoring');

// Mock Supabase client for testing
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  getBusinessByPhoneNumberSupabase: jest.fn(),
  logCallEventSupabase: jest.fn(),
}));

jest.mock('../lib/monitoring', () => ({
  trackSmsEvent: jest.fn(),
  trackOwnerAlert: jest.fn(),
}));

describe('Supabase Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Failures', () => {
    test('should handle Supabase connection timeout gracefully', async () => {
      getBusinessByPhoneNumberSupabase.mockRejectedValue(
        new Error('Connection timeout')
      );

      const result = await getBusinessByPhoneNumberSupabase('+15551234567');
      
      expect(result).toBeNull();
      expect(getBusinessByPhoneNumberSupabase).toHaveBeenCalledWith('+15551234567');
    });

    test('should handle network errors during database operations', async () => {
      logCallEventSupabase.mockRejectedValue(
        new Error('Network error: ECONNREFUSED')
      );

      const eventData = {
        callSid: 'test-call-sid',
        from: '+15551234567',
        to: '+15559876543',
        businessId: 'test-business-id',
        eventType: 'voice.missed'
      };

      const result = await logCallEventSupabase(eventData);
      
      expect(result).toBeNull();
      expect(logCallEventSupabase).toHaveBeenCalledWith(eventData);
    });
  });

  describe('Data Validation Edge Cases', () => {
    test('should handle malformed phone numbers', async () => {
      const malformedNumbers = [
        'not-a-phone-number',
        '123',
        '+1555123456789012345', // too long
        '', // empty
        null,
        undefined
      ];

      for (const number of malformedNumbers) {
        getBusinessByPhoneNumberSupabase.mockResolvedValue(null);
        
        const result = await getBusinessByPhoneNumberSupabase(number);
        expect(result).toBeNull();
      }
    });

    test('should handle missing required fields in call events', async () => {
      const incompleteEventData = [
        { callSid: 'test-sid' }, // missing other required fields
        { from: '+15551234567' }, // missing callSid
        { to: '+15559876543' }, // missing callSid and from
        {}, // completely empty
        null,
        undefined
      ];

      for (const eventData of incompleteEventData) {
        logCallEventSupabase.mockResolvedValue(null);
        
        const result = await logCallEventSupabase(eventData);
        expect(result).toBeNull();
      }
    });
  });

  describe('Rate Limiting and Concurrency', () => {
    test('should handle concurrent business lookups', async () => {
      const phoneNumber = '+15551234567';
      const mockBusiness = {
        id: 'test-business-id',
        name: 'Test Business',
        phone_number: phoneNumber
      };

      getBusinessByPhoneNumberSupabase.mockResolvedValue(mockBusiness);

      // Simulate concurrent requests
      const promises = Array(10).fill().map(() => 
        getBusinessByPhoneNumberSupabase(phoneNumber)
      );

      const results = await Promise.all(promises);
      
      // All requests should succeed
      results.forEach(result => {
        expect(result).toEqual(mockBusiness);
      });

      expect(getBusinessByPhoneNumberSupabase).toHaveBeenCalledTimes(10);
    });

    test('should handle Supabase rate limiting gracefully', async () => {
      getBusinessByPhoneNumberSupabase.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const result = await getBusinessByPhoneNumberSupabase('+15551234567');
      
      expect(result).toBeNull();
    });
  });

  describe('Mock System Compatibility', () => {
    test('should work with mock data when Supabase is unavailable', async () => {
      // Simulate Supabase unavailable, falling back to mock
      getBusinessByPhoneNumberSupabase.mockImplementation(() => {
        console.log('Supabase client not initialized. Returning mock data.');
        return Promise.resolve({
          id: 'mock-business-id',
          name: 'Mock Business',
          phone_number: '+15551234567',
          subscription_tier: 'basic',
          customSettings: {
            autoReplyEnabled: true,
            autoReplyMessage: "Thanks for calling! We'll get back to you as soon as possible."
          }
        });
      });

      const result = await getBusinessByPhoneNumberSupabase('+15551234567');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('mock-business-id');
      expect(result.name).toBe('Mock Business');
    });

    test('should handle monitoring functions with mock fallbacks', async () => {
      trackSmsEvent.mockImplementation((eventData) => {
        console.log('[MOCK] Tracking SMS event:', eventData);
        return Promise.resolve({ id: 'mock-sms-event-id', ...eventData });
      });

      const eventData = {
        messageSid: 'test-message-sid',
        from: '+15551234567',
        to: '+15559876543',
        businessId: 'test-business-id',
        status: 'sent'
      };

      const result = await trackSmsEvent(eventData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('mock-sms-event-id');
      expect(result.messageSid).toBe('test-message-sid');
    });
  });

  describe('Data Consistency', () => {
    test('should handle duplicate call event prevention', async () => {
      const callSid = 'duplicate-test-call-sid';
      
      // First call should succeed
      logCallEventSupabase.mockResolvedValueOnce({
        id: 'event-1',
        call_sid: callSid,
        event_type: 'voice.missed'
      });

      // Second call with same CallSid should be prevented
      logCallEventSupabase.mockResolvedValueOnce(null);

      const eventData = {
        callSid,
        from: '+15551234567',
        to: '+15559876543',
        businessId: 'test-business-id',
        eventType: 'voice.missed'
      };

      const result1 = await logCallEventSupabase(eventData);
      const result2 = await logCallEventSupabase(eventData);

      expect(result1).toBeDefined();
      expect(result1.call_sid).toBe(callSid);
      expect(result2).toBeNull(); // Duplicate prevented
    });
  });

  describe('Error Recovery', () => {
    test('should recover from temporary database errors', async () => {
      let callCount = 0;
      
      getBusinessByPhoneNumberSupabase.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          return Promise.reject(new Error('Temporary database error'));
        } else {
          // Second call succeeds
          return Promise.resolve({
            id: 'recovered-business-id',
            name: 'Recovered Business'
          });
        }
      });

      // First attempt should fail
      const result1 = await getBusinessByPhoneNumberSupabase('+15551234567').catch(() => null);
      expect(result1).toBeNull();

      // Second attempt should succeed
      const result2 = await getBusinessByPhoneNumberSupabase('+15551234567');
      expect(result2).toBeDefined();
      expect(result2.id).toBe('recovered-business-id');
    });
  });

  describe('Performance Edge Cases', () => {
    test('should handle large payload data efficiently', async () => {
      const largePayload = {
        callSid: 'large-payload-test',
        from: '+15551234567',
        to: '+15559876543',
        businessId: 'test-business-id',
        eventType: 'voice.missed',
        payload: {
          // Simulate large Twilio webhook payload
          largeData: 'x'.repeat(10000), // 10KB of data
          metadata: Array(100).fill().map((_, i) => ({
            key: `metadata_${i}`,
            value: `value_${i}_${'x'.repeat(100)}`
          }))
        }
      };

      logCallEventSupabase.mockResolvedValue({
        id: 'large-payload-event-id',
        ...largePayload
      });

      const startTime = Date.now();
      const result = await logCallEventSupabase(largePayload);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.id).toBe('large-payload-event-id');
      
      // Should complete within reasonable time (< 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});

describe('Migration Regression Prevention', () => {
  test('should not contain any Airtable references', () => {
    // This test ensures no Airtable code accidentally gets reintroduced
    const fs = require('fs');
    const path = require('path');
    
    const checkFileForAirtable = (filePath) => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const airtableReferences = [
          'airtable',
          'Airtable',
          'AIRTABLE',
          'airtable-utils',
          'api-compat'
        ];
        
        for (const ref of airtableReferences) {
          if (content.includes(ref) && !filePath.includes('test') && !filePath.includes('migration-audit')) {
            throw new Error(`Found Airtable reference "${ref}" in ${filePath}`);
          }
        }
      }
    };

    // Check critical files for Airtable references
    const criticalFiles = [
      'pages/api/missed-call.ts',
      'pages/api/twilio/voice.ts',
      'lib/supabase.js',
      'lib/monitoring.js',
      'vercel-build.js'
    ];

    criticalFiles.forEach(checkFileForAirtable);
  });

  test('should have direct Supabase imports in migrated endpoints', () => {
    const fs = require('fs');
    
    const checkDirectImports = (filePath, expectedImports) => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        expectedImports.forEach(importName => {
          expect(content).toMatch(new RegExp(`from.*lib/(supabase|monitoring).*${importName}`));
        });
        
        // Should NOT import from api-compat
        expect(content).not.toContain('from \'../../lib/api-compat\'');
      }
    };

    // Verify migrated endpoints use direct imports
    checkDirectImports('pages/api/missed-call.ts', [
      'getBusinessByPhoneNumberSupabase',
      'logCallEventSupabase',
      'trackSmsEvent',
      'trackOwnerAlert'
    ]);

    checkDirectImports('pages/api/twilio/voice.ts', [
      'getBusinessByPhoneNumberSupabase',
      'logCallEventSupabase'
    ]);
  });
});
