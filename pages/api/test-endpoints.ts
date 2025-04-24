import type { NextApiRequest, NextApiResponse } from 'next';
import handleMissedCall from './missed-call';
import handleNewMessage from './new-message';
import { URLSearchParams } from 'url';
import { Readable } from 'stream';

/**
 * Test endpoints handler
 * 
 * This API route is used for testing the missed-call and new-message endpoints
 * without having to go through the Twilio webhook validation.
 * 
 * It accepts the same parameters as the actual endpoints but routes them through
 * a test-specific endpoint to make testing easier.
 * 
 * This handler converts JSON request bodies to form-urlencoded format that Twilio uses.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the action from the query parameters
  const { action } = req.query;

  // Skip Twilio signature validation for testing
  process.env.SKIP_TWILIO_SIGNATURE = 'true';

  try {
    // Convert JSON body to form-urlencoded format
    const jsonBody = req.body;
    const formData = new URLSearchParams();
    
    // Add all properties from the JSON body to the form data
    Object.entries(jsonBody).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    
    // Convert the form data to a string
    const formString = formData.toString();
    
    // Create a readable stream from the form string
    const stream = Readable.from([Buffer.from(formString)]);
    
    // Replace the request body with the stream
    delete (req as any).body;
    (req as any)._body = true;
    (req as any).body = stream;
    
    // Set the content-type header to form-urlencoded
    req.headers['content-type'] = 'application/x-www-form-urlencoded';
    
    // Route to the appropriate handler based on the action
    switch (action) {
      case 'missed-call':
        // Forward to the missed-call handler
        return await handleMissedCall(req, res);
      
      case 'new-message':
        // Forward to the new-message handler
        return await handleNewMessage(req, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error in test-endpoints handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
