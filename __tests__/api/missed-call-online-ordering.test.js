/**
 * Test for online ordering URL functionality in missed call handler
 */

const handler = require('../../pages/api/missed-call').default;
const { mockBusinessWithOrderingUrl, mockBusinessWithoutOrderingUrl, resetMocks } = require('../../__mocks__/lib/supabase');
const { sendSms } = require('../../lib/twilio');

// Mock the twilio sendSms function
jest.mock('../../lib/twilio', () => ({
  sendSms: jest.fn().mockResolvedValue({ sid: 'test-sid', status: 'sent', body: 'Test message' })
}));

// Mock the openai function
jest.mock('../../lib/openai', () => ({
  generateMissedCallResponse: jest.fn().mockResolvedValue('AI generated response')
}));

// Mock the api-compat functions
jest.mock('../../lib/api-compat', () => ({
  getBusinessByPhoneNumberSupabase: jest.fn().mockImplementation(require('../../__mocks__/lib/supabase').getBusinessByPhoneNumberSupabase),
  logCallEventSupabase: jest.fn().mockResolvedValue({}),
  trackSmsEvent: jest.fn().mockResolvedValue({}),
  trackOwnerAlert: jest.fn().mockResolvedValue({})
}));

// Mock the raw-body module
jest.mock('raw-body', () => jest.fn().mockImplementation(async () => {
  return Buffer.from('To=+18186518560&From=+16195559876&CallSid=TEST123&CallStatus=no-answer');
}));

// Mock the checkCallSidExists function
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null })
    })
  }
}));

describe('Missed Call Handler with Online Ordering URL', () => {
  let req;
  let res;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    resetMocks();
    
    // Set up request and response objects
    req = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn()
    };
  });
  
  it('should include online ordering URL in auto-reply when available', async () => {
    // Mock a business with an online ordering URL
    mockBusinessWithOrderingUrl();
    
    // Call the handler
    await handler(req, res);
    
    // Check that sendSms was called with the correct parameters
    expect(sendSms).toHaveBeenCalled();
    
    // Get the call arguments
    const smsArgs = sendSms.mock.calls[0][0];
    
    // Verify that the message body contains the online ordering URL
    expect(smsArgs.body).toContain('Order online here: https://order.mockbusiness.com');
    
    // Verify that the response was successful
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });
  
  it('should not include online ordering URL in auto-reply when not available', async () => {
    // Mock a business without an online ordering URL
    mockBusinessWithoutOrderingUrl();
    
    // Call the handler
    await handler(req, res);
    
    // Check that sendSms was called with the correct parameters
    expect(sendSms).toHaveBeenCalled();
    
    // Get the call arguments
    const smsArgs = sendSms.mock.calls[0][0];
    
    // Verify that the message body does not contain the online ordering URL
    expect(smsArgs.body).not.toContain('Order online here:');
    
    // Verify that the response was successful
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });
});
