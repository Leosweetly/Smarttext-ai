#!/usr/bin/env node

/**
 * Test script for SmartText AI number
 * 
 * This script tests if the SmartText AI number is properly configured
 * and being used for sending auto-text messages.
 * 
 * Usage: node scripts/test-smarttext-number.js
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// We need to use dynamic import since the Twilio module uses ES modules
async function importModules() {
  // Create a temporary file that re-exports the functions we need
  const tempFile = path.resolve(__dirname, '../temp-smarttext-test.js');
  
  fs.writeFileSync(tempFile, `
    import twilio from 'twilio';
    
    export async function sendTestMessage(from, to, body) {
      const client = twilio(
        process.env.TWILIO_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      return await client.messages.create({
        body,
        from,
        to
      });
    }
  `);
  
  // Use dynamic import to load the ES module
  const { sendTestMessage } = await import('../temp-smarttext-test.js');
  
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  
  return { sendTestMessage };
}

async function main() {
  try {
    console.log('\n🔍 Testing SmartText AI Number Configuration');
    
    // Check if required environment variables are set
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Error: TWILIO_SID and TWILIO_AUTH_TOKEN environment variables must be set');
      console.error('Please add these to your .env.local file');
      process.exit(1);
    }
    
    // Check if SmartText AI number is set
    const smartTextNumber = process.env.TWILIO_SMARTTEXT_NUMBER;
    const businessNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!smartTextNumber) {
      console.error('❌ Error: TWILIO_SMARTTEXT_NUMBER environment variable is not set');
      console.error('Please add it to your .env.local file');
      
      if (businessNumber) {
        console.log(`\n⚠️ Note: TWILIO_PHONE_NUMBER is set to ${businessNumber}`);
        console.log('The system will use this number for sending auto-text messages instead.');
      }
      
      process.exit(1);
    }
    
    console.log(`✅ SmartText AI number is set to: ${smartTextNumber}`);
    
    // Ask for a test phone number
    console.log('\n📱 Please enter a phone number to receive a test message:');
    console.log('(Press Enter to use a random test number)');
    
    // Read from stdin
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('> ', async (input) => {
      readline.close();
      
      // Use the provided number or generate a random one
      const testNumber = input.trim() || `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      
      console.log(`\n🔄 Sending test message to ${testNumber}...`);
      
      try {
        // Import the modules
        const { sendTestMessage } = await importModules();
        
        // Send a test message
        const message = await sendTestMessage(
          smartTextNumber,
          testNumber,
          `This is a test message from SmartText AI (${new Date().toLocaleTimeString()})`
        );
        
        console.log('\n✅ Test message sent successfully!');
        console.log(`Message SID: ${message.sid}`);
        console.log(`From: ${message.from}`);
        console.log(`To: ${message.to}`);
        console.log(`Body: ${message.body}`);
        console.log(`Status: ${message.status}`);
        
        console.log('\n🎉 SmartText AI number is working correctly!');
        console.log('The system will use this number for sending auto-text messages.');
      } catch (error) {
        console.error('\n❌ Error sending test message:', error.message);
        
        if (error.code === 21608) {
          console.error('\nThis error indicates that the SmartText AI number is not capable of sending SMS messages.');
          console.error('Please make sure the number is SMS-enabled in your Twilio account.');
        } else if (error.code === 21614) {
          console.error('\nThis error indicates that the recipient number is not a valid, SMS-capable phone number.');
          console.error('Please try again with a different phone number.');
        }
        
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
