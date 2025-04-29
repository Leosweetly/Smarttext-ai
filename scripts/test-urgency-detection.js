/**
 * Test script for urgency detection in the new-message API
 * 
 * This script tests the urgency detection feature by sending test messages
 * with various urgency keywords and verifying the response.
 */

const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

// Test messages with urgency keywords
const testMessages = [
  { body: "I need help with my order", expectUrgent: true, keyword: "need help" },
  { body: "This is an URGENT request", expectUrgent: true, keyword: "urgent" },
  { body: "We have an emergency situation", expectUrgent: true, keyword: "emergency" },
  { body: "My sink is leaking badly", expectUrgent: true, keyword: "leaking" },
  { body: "I need a quote for a new project", expectUrgent: true, keyword: "need a quote" },
  { body: "We have no power in the building", expectUrgent: true, keyword: "no power" },
  { body: "Our AC is not working", expectUrgent: true, keyword: "no AC" },
  { body: "The pipe is broken and water is everywhere", expectUrgent: true, keyword: "broken" },
  { body: "I'd like to request service for next week", expectUrgent: true, keyword: "request service" },
  { body: "Just checking your hours", expectUrgent: false, keyword: null },
  { body: "Do you have a menu online?", expectUrgent: false, keyword: null },
  { body: "Thanks for the great service yesterday", expectUrgent: false, keyword: null }
];

// Mock Twilio webhook parameters
const mockWebhookParams = {
  To: '+15551234567',       // Business Twilio number
  From: '+15559876543',     // Customer phone number
  testMode: 'true',         // Enable test mode to use mock business
  disableOpenAI: 'true'     // Skip OpenAI calls for faster testing
};

// Test each message
async function runTests() {
  console.log('🧪 Starting urgency detection tests...\n');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const test of testMessages) {
    // Create form data for this test
    const params = new URLSearchParams({
      ...mockWebhookParams,
      Body: test.body
    });
    
    try {
      // Send request to the API endpoint
      const response = await fetch('http://localhost:3000/api/new-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      
      // Parse the response
      const result = await response.json();
      
      // Check if urgency detection worked as expected
      const hasUrgentFlag = Boolean(result.urgentFlag);
      const testPassed = hasUrgentFlag === test.expectUrgent;
      
      if (testPassed) {
        passCount++;
        console.log(`✅ PASS: "${test.body}"`);
        if (hasUrgentFlag) {
          console.log(`   Detected as urgent (source: ${result.urgencySource})`);
          if (result.urgentKeyword) {
            console.log(`   Matched keyword: "${result.urgentKeyword}"`);
          }
        } else {
          console.log('   Correctly not flagged as urgent');
        }
      } else {
        failCount++;
        console.log(`❌ FAIL: "${test.body}"`);
        console.log(`   Expected urgent: ${test.expectUrgent}, Got: ${hasUrgentFlag}`);
        if (test.expectUrgent) {
          console.log(`   Should have matched keyword: "${test.keyword}"`);
        }
      }
      
      // Show the response message
      console.log(`   Response: "${result.responseMessage}"`);
      console.log(''); // Empty line for readability
      
    } catch (error) {
      console.error(`❌ ERROR testing "${test.body}":`, error.message);
      failCount++;
    }
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`   Total tests: ${testMessages.length}`);
  console.log(`   Passed: ${passCount}`);
  console.log(`   Failed: ${failCount}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All urgency detection tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Error running tests:', err);
  process.exit(1);
});
