#!/usr/bin/env node

/**
 * Simple script to test the missed call endpoint with different Content-Types
 */

import axios from 'axios';
import querystring from 'querystring';

// Test parameters
const testParams = {
  To: '+18186518560',
  From: '+16193721633', // Using the user's number
  CallSid: 'TEST_CALL_' + Date.now(),
  CallStatus: 'no-answer',
  ConnectDuration: '0'
};

async function testWithFormUrlEncoded() {
  try {
    console.log('\n🧪 Testing with application/x-www-form-urlencoded Content-Type...');
    
    // Create form data (x-www-form-urlencoded format that Twilio uses)
    const formData = querystring.stringify(testParams);
    
    const response = await axios.post('https://smarttext-webhook-opefypaz3-kyle-davis-projects-30fc1531.vercel.app/api/missed-call', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error testing with form-urlencoded:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

async function testWithJson() {
  try {
    console.log('\n🧪 Testing with application/json Content-Type...');
    
    // Use the same parameters but send as JSON
    const response = await axios.post('https://smarttext-webhook-opefypaz3-kyle-davis-projects-30fc1531.vercel.app/api/missed-call', testParams, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error testing with JSON:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting missed call endpoint tests...');
  
  // Test with form-urlencoded (Twilio's default)
  const formTest = await testWithFormUrlEncoded();
  
  // Test with JSON
  const jsonTest = await testWithJson();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`Form-urlencoded test: ${formTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`JSON test: ${jsonTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (formTest && jsonTest) {
    console.log('\n🎉 All tests passed! The missed-call endpoint can handle both Content-Types.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above for details.');
  }
}

runTests();
