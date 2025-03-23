#!/usr/bin/env node

/**
 * This script provides a direct test of the Twilio auto-text functionality.
 * It bypasses the complex business logic and directly sends an SMS when triggered.
 * 
 * Usage: node scripts/test-direct-autotext.js
 */

const dotenv = require('dotenv');
const path = require('path');
const twilio = require('twilio');
const express = require('express');
const bodyParser = require('body-parser');
const ngrok = require('ngrok');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Twilio credentials
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_TEST_NUMBER = process.env.TWILIO_TEST_NUMBER || '+18186518560'; // The number to test

// Check if Twilio credentials are set
if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
  console.error('❌ Twilio credentials not found in environment variables');
  console.log('Please set TWILIO_SID and TWILIO_AUTH_TOKEN in your .env.local file');
  process.exit(1);
}

// Initialize Twilio client
const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

// Create Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Voice webhook endpoint
app.post('/voice', (req, res) => {
  console.log('📞 Received voice webhook:', req.body);
  
  // Generate TwiML to handle the call
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say('Thank you for calling our test number. This is a test of the auto-text system.');
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Missed call webhook endpoint
app.post('/missed-call', async (req, res) => {
  console.log('📱 Received missed call webhook:', req.body);
  
  const from = req.body.From;
  const to = req.body.To;
  const callStatus = req.body.CallStatus;
  
  console.log(`Missed call from ${from} to ${to} (Status: ${callStatus})`);
  
  // Only send auto-text for relevant statuses
  const relevantStatuses = ['no-answer', 'busy', 'failed', 'completed'];
  if (!relevantStatuses.includes(callStatus)) {
    console.log(`Call status ${callStatus} does not trigger auto-text`);
    return res.json({ success: true, message: 'Call status not requiring auto-text' });
  }
  
  try {
    // Send a simple auto-text message
    const message = await client.messages.create({
      body: `Thanks for calling our test number! This is an automated response to your missed call. (Status: ${callStatus})`,
      from: to, // Use the called number as the sender
      to: from // Send to the caller
    });
    
    console.log(`✅ Auto-text sent with SID: ${message.sid}`);
    res.json({ success: true, messageSid: message.sid });
  } catch (error) {
    console.error('❌ Error sending auto-text:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server and expose it via ngrok
async function startServer() {
  try {
    // Start Express server on a random port
    const port = 3333;
    const server = app.listen(port, () => {
      console.log(`🚀 Local server running on http://localhost:${port}`);
    });
    
    // Start ngrok to expose the server
    const url = await ngrok.connect(port);
    console.log(`🌐 Server exposed at: ${url}`);
    
    // Update the Twilio number's webhooks
    try {
      const numbers = await client.incomingPhoneNumbers.list({ phoneNumber: TWILIO_TEST_NUMBER });
      
      if (numbers.length === 0) {
        console.error(`❌ No Twilio number found matching ${TWILIO_TEST_NUMBER}`);
        return;
      }
      
      const number = numbers[0];
      console.log(`📱 Found Twilio number: ${number.phoneNumber} (${number.friendlyName})`);
      
      // Update the webhooks
      await client.incomingPhoneNumbers(number.sid).update({
        voiceUrl: `${url}/voice`,
        statusCallback: `${url}/missed-call`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['completed', 'busy', 'no-answer', 'failed']
      });
      
      console.log('✅ Twilio webhooks updated successfully');
      console.log(`Voice URL: ${url}/voice`);
      console.log(`Status Callback: ${url}/missed-call`);
      
      console.log('\n📱 Ready to test! Call the number and hang up to trigger the auto-text:');
      console.log(TWILIO_TEST_NUMBER);
      
      // Keep the server running until Ctrl+C
      console.log('\n⏳ Press Ctrl+C to stop the server...');
    } catch (error) {
      console.error('❌ Error updating Twilio webhooks:', error);
    }
    
    // Handle cleanup on exit
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await ngrok.kill();
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
  }
}

// Start the server
startServer();
