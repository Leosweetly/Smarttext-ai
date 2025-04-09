/**
 * Tests for the SMS auto-reply API endpoint
 * 
 * This file contains Jest tests for the /api/new-message endpoint
 * that handles incoming SMS messages and sends automated replies.
 */

import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/new-message';
import { generateSmsResponse } from '../../lib/openai';

// Mock the dependencies
jest.mock('../../lib/openai', () => ({
  generateSmsResponse: jest.fn().mockImplementation((message, faqs, businessName) => {
    if (message === 'test openai failure') {
      return null;
    }
    return 'This is an AI-generated response for: ' + message;
  })
}));

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: jest.fn().mockResolvedValue({
          sid: 'mock-message-sid',
          status: 'queued'
        })
      }
    };
  });
});

jest.mock('../../lib/data/airtable-client', () => {
  const mockBusinessRecord = {
    id: 'rec123456',
    get: jest.fn((field) => {
      if (field === 'Business Name') return 'Test Business';
      if (field === 'FAQs') return JSON.stringify([
        {
          question: 'What are your hours?',
          answer: 'We are open 9am-5pm Monday to Friday.'
        },
        {
          question: 'Do you offer delivery?',
          answer: 'Yes, we offer free delivery on orders over $50.'
        }
      ]);
      if (field === 'Auto-Reply Enabled') return true;
      return null;
    })
  };

  const mockDisabledBusinessRecord = {
    id: 'rec789012',
    get: jest.fn((field) => {
      if (field === 'Business Name') return 'Disabled Business';
      if (field === 'FAQs') return JSON.stringify([
        {
          question: 'What are your hours?',
          answer: 'We are open 9am-5pm Monday to Friday.'
        }
      ]);
      if (field === 'Auto-Reply Enabled') return false;
      return null;
    })
  };

  return {
    getTable: jest.fn(() => ({
      select: jest.fn(() => ({
        firstPage: jest.fn().mockImplementation(async () => {
          // Return different mock records based on the phone number
          if (global.mockPhoneNumber === '+16193721633') {
            return [mockBusinessRecord];
          } else if (global.mockPhoneNumber === '+17145551234') {
            return [mockDisabledBusinessRecord];
          } else {
            return [];
          }
        })
      }))
    }))
  };
});

describe('/api/new-message', () => {
  beforeEach(() => {
    // Reset console mocks before each test
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console mocks after each test
    console.log.mockRestore();
    console.error.mockRestore();
  });

  test('returns 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({ error: 'Method not allowed' });
  });

  test('returns 400 if required fields are missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // Missing required fields
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toHaveProperty('error', 'Missing required fields');
  });

  test('returns 404 if business is not found', async () => {
    global.mockPhoneNumber = '+19999999999'; // This will return empty results

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        To: '+19999999999',
        From: '+12125551234',
        Body: 'Hello'
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._getJSONData()).toHaveProperty('error', 'Business not found');
  });

  test('respects Auto-Reply Enabled setting when false', async () => {
    global.mockPhoneNumber = '+17145551234'; // This will return the disabled business

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        To: '+17145551234',
        From: '+12125551234',
        Body: 'Hello'
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toHaveProperty('message', 'Auto-reply is disabled for this business');
  });

  test('matches FAQ and sends correct response', async () => {
    global.mockPhoneNumber = '+16193721633'; // This will return the enabled business

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        To: '+16193721633',
        From: '+12125551234',
        Body: 'What are your hours?'
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toHaveProperty('success', true);
    expect(res._getJSONData()).toHaveProperty('matchedFaq', 'What are your hours?');
    expect(res._getJSONData()).toHaveProperty('responseMessage', 'We are open 9am-5pm Monday to Friday.');
  });

  test('uses OpenAI when no FAQ matches and returns AI response', async () => {
    global.mockPhoneNumber = '+16193721633'; // This will return the enabled business

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        To: '+16193721633',
        From: '+12125551234',
        Body: 'Something that needs AI response'
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toHaveProperty('success', true);
    expect(res._getJSONData()).toHaveProperty('matchedFaq', null);
    expect(res._getJSONData()).toHaveProperty('responseSource', 'openai');
    expect(res._getJSONData().responseMessage).toContain('AI-generated response');
  });

  test('falls back to default message when OpenAI fails', async () => {
    global.mockPhoneNumber = '+16193721633'; // This will return the enabled business

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        To: '+16193721633',
        From: '+12125551234',
        Body: 'test openai failure'
      },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toHaveProperty('success', true);
    expect(res._getJSONData()).toHaveProperty('matchedFaq', null);
    expect(res._getJSONData()).toHaveProperty('responseSource', 'default_fallback');
    expect(res._getJSONData().responseMessage).toBe("Sorry, we couldn't understand your question. Please call us directly.");
  });
});
